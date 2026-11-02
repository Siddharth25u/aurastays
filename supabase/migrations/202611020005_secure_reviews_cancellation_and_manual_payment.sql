-- Applied to Supabase project hhehtntqbnxflitkrqvh.
-- Room inventory is managed by the parent hotel's verified owner or an admin.
drop policy if exists "Authenticated users can create rooms" on public.rooms;
drop policy if exists "Authenticated users can update rooms" on public.rooms;
drop policy if exists "Authenticated users can delete rooms" on public.rooms;
drop policy if exists "rooms owner write" on public.rooms;
drop policy if exists "Public can view rooms" on public.rooms;
drop policy if exists "Rooms can be viewed by everyone" on public.rooms;
drop policy if exists "rooms public read" on public.rooms;
create policy "Public can view rooms" on public.rooms
  for select to anon, authenticated using (true);
create policy "Hotel owners and admins manage rooms" on public.rooms
  for all to authenticated
  using (
    exists (select 1 from public.hotels h where h.id = rooms.hotel_id
      and (h.owner_id = (select auth.uid()) or exists (
        select 1 from public.user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin'
      )))
    and exists (select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role in ('owner','admin'))
  )
  with check (
    exists (select 1 from public.hotels h where h.id = rooms.hotel_id
      and (h.owner_id = (select auth.uid()) or exists (
        select 1 from public.user_roles ur where ur.user_id = (select auth.uid()) and ur.role = 'admin'
      )))
    and exists (select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.role in ('owner','admin'))
  );

-- Restrict customer table reads and inserts to the authenticated customer.
drop policy if exists "Authenticated users can view customers" on public.customers;
drop policy if exists "Authenticated users can create customers" on public.customers;
create policy "Customers can view their own record" on public.customers
  for select to authenticated using (auth_user_id = (select auth.uid()));
create policy "Customers can create their own record" on public.customers
  for insert to authenticated with check (auth_user_id = (select auth.uid()));

-- Verified, completed stays only; prevent duplicate reviews per booking.
alter table public.reviews add column if not exists status text not null default 'published';
alter table public.reviews drop constraint if exists reviews_status_allowed;
alter table public.reviews add constraint reviews_status_allowed
  check (status in ('pending','published','hidden'));
create unique index if not exists reviews_one_per_booking
  on public.reviews(booking_id) where booking_id is not null;
drop policy if exists "Allow public insert reviews" on public.reviews;
drop policy if exists "Allow public read reviews" on public.reviews;
drop policy if exists "Customers can read published reviews" on public.reviews;
drop policy if exists "Customers can submit verified booking reviews" on public.reviews;
drop policy if exists "Customers can update their own verified reviews" on public.reviews;
create policy "Customers can read published reviews" on public.reviews
  for select to anon, authenticated using (status = 'published');
create policy "Customers can submit verified booking reviews" on public.reviews
  for insert to authenticated with check (
    customer_id is not null and booking_id is not null and status = 'published'
    and exists (
      select 1 from public.bookings b
      join public.customers c on c.id = b.customer_id
      where b.id = reviews.booking_id and b.hotel_id = reviews.hotel_id
        and (reviews.room_id is null or b.room_id = reviews.room_id)
        and b.customer_id = reviews.customer_id
        and c.auth_user_id = (select auth.uid())
        and lower(b.status) = 'completed' and b.check_out <= current_date
    )
  );

-- Keep hotel rating aggregates consistent with published reviews.
create or replace function public.refresh_hotel_rating()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare affected_hotel uuid;
begin
  affected_hotel := coalesce(new.hotel_id, old.hotel_id);
  update public.hotels h
  set rating = coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r
                         where r.hotel_id = affected_hotel and r.status = 'published'), 0),
      review_count = (select count(*)::integer from public.reviews r
                      where r.hotel_id = affected_hotel and r.status = 'published'),
      updated_at = now()
  where h.id = affected_hotel;
  return coalesce(new, old);
end;
$$;
drop trigger if exists reviews_refresh_hotel_rating on public.reviews;
create trigger reviews_refresh_hotel_rating
after insert or update or delete on public.reviews
for each row execute function public.refresh_hotel_rating();

create or replace function public.get_hotel_rating(p_hotel_id uuid)
returns table(average_rating numeric, review_count bigint)
language sql stable set search_path = public, pg_temp
as $$
  select coalesce(round(avg(rating)::numeric, 1), 0), count(*)
  from public.reviews where hotel_id = p_hotel_id and status = 'published';
$$;

-- Customers may cancel only unpaid pending bookings before check-in.
create or replace function public.cancel_pending_booking(p_booking_id uuid)
returns boolean language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_customer_id uuid;
  v_status text;
  v_check_in date;
  v_payment_status text;
begin
  if v_user_id is null then raise exception 'Sign in required.'; end if;
  select c.id into v_customer_id from public.customers c
    where c.auth_user_id = v_user_id limit 1;
  if v_customer_id is null then raise exception 'Customer profile not found.'; end if;
  select b.status, b.check_in, p.status into v_status, v_check_in, v_payment_status
  from public.bookings b join public.payments p on p.booking_id = b.id
  where b.id = p_booking_id and b.customer_id = v_customer_id
  for update of b, p;
  if not found then raise exception 'Booking not found.'; end if;
  if lower(v_status) <> 'pending' or lower(v_payment_status) <> 'pending' then
    raise exception 'Only unpaid pending bookings can be cancelled online.';
  end if;
  if v_check_in <= current_date then
    raise exception 'Bookings on or after check-in cannot be cancelled online.';
  end if;
  update public.bookings set status = 'cancelled', updated_at = now() where id = p_booking_id;
  update public.payments set status = 'cancelled'
    where booking_id = p_booking_id and status = 'pending';
  return true;
end;
$$;

-- Only the property's owner or an admin can manually verify payment.
create or replace function public.confirm_manual_payment(p_booking_id uuid)
returns boolean language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_hotel_id uuid;
  v_booking_status text;
  v_payment_status text;
  v_role text;
begin
  if v_user_id is null then raise exception 'Sign in required.'; end if;
  select role into v_role from public.user_roles where user_id = v_user_id;
  if v_role not in ('owner','admin') then raise exception 'Owner or admin access required.'; end if;
  select b.hotel_id, b.status, p.status into v_hotel_id, v_booking_status, v_payment_status
  from public.bookings b join public.payments p on p.booking_id = b.id
  where b.id = p_booking_id for update of b, p;
  if not found then raise exception 'Booking not found.'; end if;
  if v_role <> 'admin' and not exists (
    select 1 from public.hotels h where h.id = v_hotel_id and h.owner_id = v_user_id
  ) then raise exception 'You do not manage this property.'; end if;
  if lower(v_booking_status) <> 'pending' or lower(v_payment_status) <> 'pending' then
    raise exception 'Only pending bookings and payments can be verified.';
  end if;
  update public.payments set status = 'paid', paid_at = now()
    where booking_id = p_booking_id and status = 'pending';
  update public.bookings set status = 'confirmed', updated_at = now()
    where id = p_booking_id and status = 'pending';
  return true;
end;
$$;

revoke all on function public.cancel_pending_booking(uuid) from public, anon;
grant execute on function public.cancel_pending_booking(uuid) to authenticated;
revoke all on function public.confirm_manual_payment(uuid) from public, anon;
grant execute on function public.confirm_manual_payment(uuid) to authenticated;
revoke all on function public.refresh_hotel_rating() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.get_hotel_rating(uuid) from public, anon;
grant execute on function public.get_hotel_rating(uuid) to authenticated;
alter function public.update_updated_at() set search_path = public, pg_temp;
