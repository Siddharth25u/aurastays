-- Track how many physical units a room listing represents.
alter table public.rooms
  add column if not exists inventory_count integer not null default 1;

alter table public.rooms
  drop constraint if exists rooms_inventory_count_positive;
alter table public.rooms
  add constraint rooms_inventory_count_positive check (inventory_count >= 1);

-- Serialize reservation attempts for the same room, then check date overlap
-- before inserting. This prevents two concurrent customers taking the last unit.
create or replace function public.create_pending_booking(
  p_hotel_slug text, p_room_id uuid, p_check_in date, p_check_out date,
  p_guests integer, p_rooms integer, p_first_name text, p_last_name text,
  p_email text, p_phone text, p_special_request text default null
)
returns table (booking_id uuid, booking_number text, booking_total numeric, payment_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_customer_id uuid;
  v_hotel_id uuid;
  v_room_price numeric;
  v_max_guests integer;
  v_room_status text;
  v_inventory_count integer;
  v_booked_units integer;
  v_nights integer;
  v_subtotal numeric;
  v_tax numeric;
  v_total numeric;
  v_booking_id uuid;
  v_booking_number text;
begin
  if v_user_id is null then raise exception 'Please sign in before creating a booking.'; end if;
  if nullif(trim(p_first_name),'') is null or nullif(trim(p_last_name),'') is null
     or nullif(trim(p_email),'') is null or nullif(trim(p_phone),'') is null then
    raise exception 'Guest name, email and phone are required.';
  end if;
  if p_check_in is null or p_check_out is null or p_check_in < current_date or p_check_out <= p_check_in then
    raise exception 'Please select valid future check-in and check-out dates.';
  end if;
  if p_guests < 1 or p_rooms < 1 or p_rooms > 5 then
    raise exception 'Guest or room count is invalid.';
  end if;

  -- Lock the room row so simultaneous bookings for the same room serialize.
  select h.id, r.price, r.max_guests, r.status, r.inventory_count
    into v_hotel_id, v_room_price, v_max_guests, v_room_status, v_inventory_count
  from public.hotels h
  join public.rooms r on r.hotel_id = h.id
  where h.slug = trim(p_hotel_slug) and r.id = p_room_id
  for update of r;

  if v_hotel_id is null then raise exception 'Selected hotel or room could not be found.'; end if;
  if lower(coalesce(v_room_status,'available')) <> 'available' then
    raise exception 'This room is currently unavailable.';
  end if;
  if p_guests > (v_max_guests * p_rooms) then
    raise exception 'Guest count exceeds the selected room capacity.';
  end if;

  -- A stay overlaps another when existing check-in < requested check-out
  -- and existing check-out > requested check-in.
  select coalesce(sum(b.rooms),0)::integer
    into v_booked_units
  from public.bookings b
  where b.room_id = p_room_id
    and lower(b.status) in ('pending','confirmed')
    and b.check_in < p_check_out
    and b.check_out > p_check_in;

  if v_booked_units + p_rooms > v_inventory_count then
    raise exception 'Not enough rooms available for these dates. Only % unit(s) remain.',
      greatest(v_inventory_count - v_booked_units, 0);
  end if;

  v_nights := p_check_out - p_check_in;
  v_subtotal := v_room_price * v_nights * p_rooms;
  v_tax := round(v_subtotal * 0.12);
  v_total := v_subtotal + v_tax;

  select c.id into v_customer_id
  from public.customers c
  where c.auth_user_id = v_user_id
  order by c.created_at asc limit 1;

  if v_customer_id is null then
    insert into public.customers(first_name,last_name,email,phone,auth_user_id)
    values(trim(p_first_name),trim(p_last_name),lower(trim(p_email)),trim(p_phone),v_user_id)
    returning id into v_customer_id;
  else
    update public.customers
      set first_name=trim(p_first_name), last_name=trim(p_last_name),
          email=lower(trim(p_email)), phone=trim(p_phone), updated_at=now()
    where id=v_customer_id;
  end if;

  v_booking_number := 'AURA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  insert into public.bookings(
    booking_number,customer_id,hotel_id,room_id,check_in,check_out,
    guests,rooms,nights,room_price,subtotal,tax,total,status,special_request
  )
  values(
    v_booking_number,v_customer_id,v_hotel_id,p_room_id,p_check_in,p_check_out,
    p_guests,p_rooms,v_nights,v_room_price,v_subtotal,v_tax,v_total,'pending',
    nullif(trim(coalesce(p_special_request,'')),'')
  )
  returning id into v_booking_id;

  insert into public.payments(booking_id,payment_method,payment_gateway,amount,currency,status)
  values(v_booking_id,'pay_at_hotel','manual',v_total,'INR','pending');

  return query select v_booking_id,v_booking_number,v_total,'pending'::text;
end;
$$;

revoke all on function public.create_pending_booking(text,uuid,date,date,integer,integer,text,text,text,text,text) from public, anon;
grant execute on function public.create_pending_booking(text,uuid,date,date,integer,integer,text,text,text,text,text) to authenticated;

create index if not exists idx_bookings_room_stay_status
  on public.bookings(room_id, check_in, check_out)
  where status in ('pending','confirmed');
