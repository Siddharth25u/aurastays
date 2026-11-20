-- Let verified owners/admins read booking and guest details only for properties they manage.
-- Customer self-read policies remain in place; these policies add the owner-side view.
create policy "Owners can view bookings for managed hotels"
on public.bookings
for select
to authenticated
using (
  exists (
    select 1
    from public.hotels h
    where h.id = bookings.hotel_id
      and (
        h.owner_id = (select auth.uid())
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = (select auth.uid()) and ur.role = 'admin'
        )
      )
  )
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'admin')
  )
);

create policy "Owners can view payments for managed hotels"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    join public.hotels h on h.id = b.hotel_id
    where b.id = payments.booking_id
      and (
        h.owner_id = (select auth.uid())
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = (select auth.uid()) and ur.role = 'admin'
        )
      )
  )
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'admin')
  )
);

create policy "Owners can view guests for managed hotel bookings"
on public.customers
for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    join public.hotels h on h.id = b.hotel_id
    where b.customer_id = customers.id
      and (
        h.owner_id = (select auth.uid())
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = (select auth.uid()) and ur.role = 'admin'
        )
      )
  )
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role in ('owner', 'admin')
  )
);
