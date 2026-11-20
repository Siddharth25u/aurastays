-- Safe review read APIs: expose published review display names without granting
-- broad customer-table access, and expose only reviews for the signed-in owner's hotels.
create or replace function public.get_public_hotel_reviews(p_hotel_id uuid)
returns table (
  id uuid,
  rating integer,
  comment text,
  photos jsonb,
  created_at timestamptz,
  guest_display_name text,
  owner_reply text,
  owner_replied_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select
    r.id,
    r.rating,
    r.comment,
    r.photos,
    r.created_at,
    case
      when nullif(trim(c.first_name), '') is null then 'Verified guest'
      when nullif(trim(c.last_name), '') is null then trim(c.first_name)
      else trim(c.first_name) || ' ' || upper(left(trim(c.last_name), 1)) || '.'
    end as guest_display_name,
    r.owner_reply,
    r.owner_replied_at
  from public.reviews r
  left join public.customers c on c.id = r.customer_id
  where r.hotel_id = p_hotel_id
    and r.status = 'published'
  order by r.created_at desc;
$function$;

create or replace function public.get_owner_reviews()
returns table (
  id uuid,
  hotel_id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  owner_reply text,
  owner_replied_at timestamptz,
  guest_name text,
  hotel_name text,
  booking_status text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  current_user_id uuid := auth.uid();
  current_role text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select ur.role into current_role
  from public.user_roles ur
  where ur.user_id = current_user_id;

  if current_role not in ('owner', 'admin') then
    raise exception 'Owner or admin access required';
  end if;

  return query
  select
    r.id,
    r.hotel_id,
    r.rating,
    r.comment,
    r.created_at,
    r.owner_reply,
    r.owner_replied_at,
    case
      when nullif(trim(c.first_name), '') is null then 'Verified guest'
      when nullif(trim(c.last_name), '') is null then trim(c.first_name)
      else trim(c.first_name) || ' ' || upper(left(trim(c.last_name), 1)) || '.'
    end as guest_name,
    h.name as hotel_name,
    b.status as booking_status
  from public.reviews r
  join public.hotels h on h.id = r.hotel_id
  left join public.customers c on c.id = r.customer_id
  left join public.bookings b on b.id = r.booking_id
  where r.status = 'published'
    and (current_role = 'admin' or h.owner_id = current_user_id)
  order by r.created_at desc;
end;
$function$;

revoke all on function public.get_public_hotel_reviews(uuid) from public;
grant execute on function public.get_public_hotel_reviews(uuid) to anon, authenticated;
revoke all on function public.get_owner_reviews() from public, anon;
grant execute on function public.get_owner_reviews() to authenticated;
