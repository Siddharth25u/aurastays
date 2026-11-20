-- Allow reviews only for the signed-in guest's own confirmed/completed stay
-- after checkout. Confirmed bookings are included because the app does not yet
-- run an automatic status transition to "completed" after checkout.
drop policy if exists "Customers can submit verified booking reviews" on public.reviews;

create policy "Customers can submit verified booking reviews"
on public.reviews
for insert
to authenticated
with check (
  customer_id is not null
  and booking_id is not null
  and status = 'published'
  and exists (
    select 1
    from public.bookings b
    join public.customers c on c.id = b.customer_id
    where b.id = reviews.booking_id
      and b.hotel_id = reviews.hotel_id
      and (reviews.room_id is null or b.room_id = reviews.room_id)
      and b.customer_id = reviews.customer_id
      and c.auth_user_id = (select auth.uid())
      and lower(b.status) in ('confirmed', 'completed')
      and b.check_out <= current_date
  )
);
