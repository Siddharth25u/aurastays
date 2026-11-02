-- Restrict hotel writes to authenticated owners/admins.
-- Public read access remains available for the customer marketplace.
drop policy if exists "Allow public insert hotels" on public.hotels;
drop policy if exists "Allow public update hotels" on public.hotels;
drop policy if exists "Allow public delete hotels" on public.hotels;

create policy "Owners and admins can insert their hotels"
on public.hotels
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('owner', 'admin')
  )
);

create policy "Owners and admins can update their hotels"
on public.hotels
for update
to authenticated
using (
  (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('owner', 'admin')
    )
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  )
)
with check (
  (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('owner', 'admin')
    )
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  )
);

create policy "Owners and admins can delete their hotels"
on public.hotels
for delete
to authenticated
using (
  (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role in ('owner', 'admin')
    )
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  )
);
