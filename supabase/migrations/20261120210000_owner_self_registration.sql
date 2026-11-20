-- Create a separate owner onboarding path without allowing self-assigned admin roles.
-- The existing auth trigger still creates/links the customer profile. It now also
-- assigns only the public account types: owner or customer. Existing roles are preserved.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  existing_customer_id uuid;
  assigned_role text;
begin
  update public.customers
  set auth_user_id = new.id,
      updated_at = now()
  where lower(trim(email)) = lower(trim(new.email))
    and auth_user_id is null
  returning id into existing_customer_id;

  if existing_customer_id is null then
    insert into public.customers (
      id, auth_user_id, first_name, last_name, email
    )
    values (
      gen_random_uuid(),
      new.id,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', ''),
      new.email
    );
  end if;

  assigned_role := case
    when lower(coalesce(new.raw_user_meta_data ->> 'account_type', '')) = 'owner'
      then 'owner'
    else 'customer'
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, assigned_role)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
