-- Aura Stays: owner onboarding and hotel approval foundation
-- Safe additive migration: does not alter existing hotels, rooms, or bookings tables.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer'
    check (role in ('customer', 'owner', 'staff', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(concat_ws(' ',
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name'
      )), '')
    ),
    'customer'
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_aura_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create table if not exists public.hotel_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  property_type text not null,
  address text not null,
  city text not null,
  state text not null,
  country text not null default 'India',
  description text,
  website text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hotel_submissions_owner_id_idx
  on public.hotel_submissions(owner_id);
create index if not exists hotel_submissions_status_created_idx
  on public.hotel_submissions(status, created_at desc);

alter table public.profiles enable row level security;
alter table public.hotel_submissions enable row level security;

-- Users may read their own profile. Role changes are intentionally not allowed
-- through a client-side profile update policy; assign privileged roles in SQL.
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_aura_admin()));

drop policy if exists "Owners can read their submissions" on public.hotel_submissions;
create policy "Owners can read their submissions"
  on public.hotel_submissions for select
  to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_aura_admin()));

drop policy if exists "Authenticated users can submit a hotel" on public.hotel_submissions;
create policy "Authenticated users can submit a hotel"
  on public.hotel_submissions for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and admin_notes is null
  );

drop policy if exists "Owners can edit pending or rejected submissions" on public.hotel_submissions;
create policy "Owners can edit pending or rejected submissions"
  on public.hotel_submissions for update
  to authenticated
  using (owner_id = (select auth.uid()) and status in ('pending', 'rejected'))
  with check (
    owner_id = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and admin_notes is null
  );

drop policy if exists "Admins can review hotel submissions" on public.hotel_submissions;
create policy "Admins can review hotel submissions"
  on public.hotel_submissions for update
  to authenticated
  using ((select public.is_aura_admin()))
  with check ((select public.is_aura_admin()));

drop policy if exists "Admins can read all hotel submissions" on public.hotel_submissions;
create policy "Admins can read all hotel submissions"
  on public.hotel_submissions for select
  to authenticated
  using ((select public.is_aura_admin()));

grant select on public.profiles to authenticated;
grant select, insert, update on public.hotel_submissions to authenticated;
grant execute on function public.is_aura_admin() to authenticated;

-- After this migration, promote the intended administrator manually:
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
-- );
