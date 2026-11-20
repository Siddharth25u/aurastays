-- Aura Rewards and hotel watch alerts
create table if not exists public.aura_reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  points integer not null check (points > 0),
  amount_basis numeric not null check (amount_basis >= 0),
  created_at timestamptz not null default now()
);
create index if not exists aura_reward_ledger_user_created_idx on public.aura_reward_ledger(user_id, created_at desc);
alter table public.aura_reward_ledger enable row level security;
drop policy if exists "Users can view their own Aura rewards" on public.aura_reward_ledger;
create policy "Users can view their own Aura rewards" on public.aura_reward_ledger for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.award_aura_rewards_for_booking()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user_id uuid; v_paid boolean; v_points integer;
begin
  select c.auth_user_id, exists(select 1 from public.payments p where p.booking_id=new.id and p.status='paid')
  into v_user_id,v_paid
  from public.customers c where c.id=new.customer_id;
  if lower(new.status)='completed' and v_paid and v_user_id is not null then
    v_points := floor(greatest(coalesce(new.total,0),0)/100)::integer;
    if v_points > 0 then
      insert into public.aura_reward_ledger(user_id,booking_id,points,amount_basis)
      values(v_user_id,new.id,v_points,new.total)
      on conflict (booking_id) do nothing;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists award_aura_rewards_after_booking_update on public.bookings;
create trigger award_aura_rewards_after_booking_update after insert or update of status on public.bookings
for each row execute function public.award_aura_rewards_for_booking();

create or replace function public.award_aura_rewards_after_payment()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_booking public.bookings%rowtype;
begin
  if new.status='paid' and (tg_op='INSERT' or old.status is distinct from new.status) then
    select * into v_booking from public.bookings where id=new.booking_id;
    if found then perform public.award_aura_rewards_for_booking_for_id(v_booking.id); end if;
  end if;
  return new;
end; $$;

create or replace function public.award_aura_rewards_for_booking_for_id(p_booking_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_booking public.bookings%rowtype; v_user_id uuid; v_paid boolean; v_points integer;
begin
 select * into v_booking from public.bookings where id=p_booking_id;
 if not found or lower(v_booking.status)<>'completed' then return; end if;
 select c.auth_user_id into v_user_id from public.customers c where c.id=v_booking.customer_id;
 select exists(select 1 from public.payments p where p.booking_id=p_booking_id and p.status='paid') into v_paid;
 v_points:=floor(greatest(coalesce(v_booking.total,0),0)/100)::integer;
 if v_user_id is not null and v_paid and v_points>0 then
  insert into public.aura_reward_ledger(user_id,booking_id,points,amount_basis)
  values(v_user_id,p_booking_id,v_points,v_booking.total) on conflict(booking_id) do nothing;
 end if;
end; $$;
create or replace function public.award_aura_rewards_after_payment()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.status='paid' and (tg_op='INSERT' or old.status is distinct from new.status) then
  perform public.award_aura_rewards_for_booking_for_id(new.booking_id);
 end if;
 return new;
end; $$;
drop trigger if exists award_aura_rewards_after_payment_update on public.payments;
create trigger award_aura_rewards_after_payment_update after insert or update of status on public.payments
for each row execute function public.award_aura_rewards_after_payment();

create table if not exists public.hotel_watch_alerts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 hotel_id uuid not null references public.hotels(id) on delete cascade,
 room_id uuid references public.rooms(id) on delete cascade,
 alert_type text not null check (alert_type in ('price_drop','availability')),
 title text not null,
 message text not null,
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists hotel_watch_alerts_user_created_idx on public.hotel_watch_alerts(user_id,created_at desc);
alter table public.hotel_watch_alerts enable row level security;
drop policy if exists "Users can view their own hotel watch alerts" on public.hotel_watch_alerts;
create policy "Users can view their own hotel watch alerts" on public.hotel_watch_alerts for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "Users can mark their own hotel watch alerts read" on public.hotel_watch_alerts;
create policy "Users can mark their own hotel watch alerts read" on public.hotel_watch_alerts for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create or replace function public.notify_favorite_guests_on_room_price_change()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.price < old.price then
  insert into public.hotel_watch_alerts(user_id,hotel_id,room_id,alert_type,title,message)
  select f.user_id,new.hotel_id,new.id,'price_drop','Price drop at '||h.name,
    'A room price dropped from ₹'||old.price::text||' to ₹'||new.price::text||'.'
  from public.favorites f join public.hotels h on h.id=new.hotel_id
  where f.hotel_id=new.hotel_id;
 end if;
 if lower(coalesce(old.status,''))<>'available' and lower(coalesce(new.status,''))='available' then
  insert into public.hotel_watch_alerts(user_id,hotel_id,room_id,alert_type,title,message)
  select f.user_id,new.hotel_id,new.id,'availability','Room available at '||h.name,
    'A previously unavailable room is now available.'
  from public.favorites f join public.hotels h on h.id=new.hotel_id
  where f.hotel_id=new.hotel_id;
 end if;
 return new;
end; $$;
drop trigger if exists notify_favorite_guests_on_room_change on public.rooms;
create trigger notify_favorite_guests_on_room_change after update of price,status on public.rooms
for each row execute function public.notify_favorite_guests_on_room_price_change();
