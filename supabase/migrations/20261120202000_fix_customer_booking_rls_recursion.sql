-- Break the customers <-> bookings RLS recursion.
-- Guest profile visibility through the customers table is intentionally removed;
-- public review rows remain readable, while customer names are visible only
-- where the existing customer self-access policy permits them.
drop policy if exists "Owners can view guests for managed hotel bookings" on public.customers;