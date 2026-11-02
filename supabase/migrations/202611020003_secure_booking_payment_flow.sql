-- Trusted booking creation: validates identity and booking inputs,
-- calculates price from the database, and creates a pending booking/payment atomically.
create or replace function public.create_pending_booking(
  p_hotel_slug text, p_room_id uuid, p_check_in date, p_check_out date,
  p_guests integer, p_rooms integer, p_first_name text, p_last_name text,
  p_email text, p_phone text, p_special_request text default null
)
returns table (booking_id uuid, booking_number text, booking_total numeric, payment_status text)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid(); v_customer_id uuid; v_hotel_id uuid;
  v_room_price numeric; v_max_guests integer; v_room_status text;
  v_nights integer; v_subtotal numeric; v_tax numeric; v_total numeric;
  v_booking_id uuid; v_booking_number text;
begin
  if v_user_id is null then raise exception 'Please sign in before creating a booking.'; end if;
  if nullif(trim(p_first_name),'') is null or nullif(trim(p_last_name),'') is null
     or nullif(trim(p_email),'') is null or nullif(trim(p_phone),'') is null then
    raise exception 'Guest name, email and phone are required.';
  end if;
  if p_check_in is null or p_check_out is null or p_check_in < current_date or p_check_out <= p_check_in then
    raise exception 'Please select valid future check-in and check-out dates.';
  end if;
  if p_guests < 1 or p_rooms < 1 or p_rooms > 5 then raise exception 'Guest or room count is invalid.'; end if;
  select h.id,r.price,r.max_guests,r.status into v_hotel_id,v_room_price,v_max_guests,v_room_status
  from public.hotels h join public.rooms r on r.hotel_id=h.id
  where h.slug=trim(p_hotel_slug) and r.id=p_room_id limit 1;
  if v_hotel_id is null then raise exception 'Selected hotel or room could not be found.'; end if;
  if lower(coalesce(v_room_status,'available')) <> 'available' then raise exception 'This room is currently unavailable.'; end if;
  if p_guests > (v_max_guests * p_rooms) then raise exception 'Guest count exceeds the selected room capacity.'; end if;
  v_nights := p_check_out-p_check_in; v_subtotal := v_room_price*v_nights*p_rooms;
  v_tax := round(v_subtotal*0.12); v_total := v_subtotal+v_tax;
  select c.id into v_customer_id from public.customers c where c.auth_user_id=v_user_id order by c.created_at asc limit 1;
  if v_customer_id is null then
    insert into public.customers(first_name,last_name,email,phone,auth_user_id)
    values(trim(p_first_name),trim(p_last_name),lower(trim(p_email)),trim(p_phone),v_user_id) returning id into v_customer_id;
  else
    update public.customers set first_name=trim(p_first_name),last_name=trim(p_last_name),
      email=lower(trim(p_email)),phone=trim(p_phone),updated_at=now() where id=v_customer_id;
  end if;
  v_booking_number := 'AURA-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  insert into public.bookings(booking_number,customer_id,hotel_id,room_id,check_in,check_out,guests,rooms,nights,room_price,subtotal,tax,total,status,special_request)
  values(v_booking_number,v_customer_id,v_hotel_id,p_room_id,p_check_in,p_check_out,p_guests,p_rooms,v_nights,v_room_price,v_subtotal,v_tax,v_total,'pending',nullif(trim(coalesce(p_special_request,'')),''))
  returning id into v_booking_id;
  insert into public.payments(booking_id,payment_method,payment_gateway,amount,currency,status)
  values(v_booking_id,null,'not_configured',v_total,'INR','pending');
  return query select v_booking_id,v_booking_number,v_total,'pending'::text;
end;
$$;
revoke all on function public.create_pending_booking(text,uuid,date,date,integer,integer,text,text,text,text,text) from public,anon;
grant execute on function public.create_pending_booking(text,uuid,date,date,integer,integer,text,text,text,text,text) to authenticated;

drop policy if exists "Users can create their own bookings" on public.bookings;
drop policy if exists "Authenticated users can create bookings" on public.bookings;
drop policy if exists "Users can view their own bookings" on public.bookings;
create policy "Customers can view their own bookings" on public.bookings for select to authenticated
using (exists(select 1 from public.customers c where c.id=bookings.customer_id and c.auth_user_id=(select auth.uid())));

drop policy if exists "Users can create payments" on public.payments;
drop policy if exists "Authenticated users can create payments" on public.payments;
drop policy if exists "Customers can view payments for their bookings" on public.payments;
create policy "Customers can view payments for their bookings" on public.payments for select to authenticated
using (exists(select 1 from public.bookings b join public.customers c on c.id=b.customer_id where b.id=payments.booking_id and c.auth_user_id=(select auth.uid())));
