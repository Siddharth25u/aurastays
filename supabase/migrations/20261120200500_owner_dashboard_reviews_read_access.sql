create policy "Owners can view reviews for managed hotels"
on public.reviews
for select
to authenticated
using (
  exists (
    select 1 from public.hotels h
    where h.id = reviews.hotel_id
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
