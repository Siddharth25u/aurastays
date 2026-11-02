# Aura Stays owner onboarding setup

This migration adds the database foundation for owner hotel submissions and admin review. It is additive and does not modify the existing customer hotel, room, or booking tables.

## 1. Apply the migration in Supabase

1. Open the Supabase project used by Aura Stays.
2. Open **SQL Editor** and create a new query.
3. Copy the complete contents of `supabase/migrations/202611020001_owner_onboarding_and_hotel_approval.sql`.
4. Run the query.
5. Confirm that `profiles` and `hotel_submissions` exist under **Table Editor**.

Do not put a Supabase service-role key in browser code or commit it to GitHub.

## 2. Promote the first Aura Stays administrator

After the migration has run and the administrator has created an account through the existing signup flow, run this in the Supabase SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (
  select id
  from auth.users
  where lower(email) = lower('YOUR_ADMIN_EMAIL')
);
```

Verify exactly one profile was updated and that its role is `admin`. Keep admin promotion restricted to trusted project administrators.

## 3. Current approval lifecycle

- A signed-in user submits a hotel application.
- The row is created with status `pending`.
- The owner can read their own application.
- Admins can read and review all applications.
- Admins change status to `approved` or `rejected` and may add review notes.
- Owners cannot approve their own application or edit review metadata.

## 4. Important integration note

This migration intentionally does not automatically publish an approved submission into the customer-facing `hotels` table. The existing hotel/room schema and booking references must be inspected first so the approval action can create a valid listing without breaking current customer pages or booking flows.

The current app uses a browser Supabase client in `lib/supabase.ts`. Before exposing owner/admin pages, add server-side authentication and enforce role checks on every privileged operation; hiding a link in the UI is not authorization.

## 5. Local verification

After applying the migration, run:

```bash
npm run lint
npm run build
```

Then test with separate customer, owner, and admin accounts. Confirm an owner cannot read another owner's application or modify approval status, and a non-admin cannot review submissions.
