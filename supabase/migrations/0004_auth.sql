-- Auth: profile creation, the admin role check, and per-user RLS.

-- ---------------------------------------------------------------------------
-- Profile creation
--
-- Supabase owns auth.users; the app reads profiles. A trigger keeps them in
-- step so no code path can create a user without a profile to hang a role off.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before the trigger existed.
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ---------------------------------------------------------------------------
-- Admin check
--
-- security definer so the function reads profiles with RLS bypassed. A policy
-- on profiles that queried profiles directly would recurse infinitely.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Per-user data
--
-- A signed-in user reaches these tables with their own session, so the policies
-- have to be right — the service role is not involved in the account area.
-- ---------------------------------------------------------------------------
alter table watchlist_items enable row level security;
alter table saved_searches enable row level security;

drop policy if exists "users manage their own watchlist" on watchlist_items;
create policy "users manage their own watchlist"
  on watchlist_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users manage their own saved searches" on saved_searches;
create policy "users manage their own saved searches"
  on saved_searches for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins can see every profile (the /admin/users table); everyone else keeps
-- the owner-only policy added in 0003.
drop policy if exists "admins read all profiles" on profiles;
create policy "admins read all profiles"
  on profiles for select
  using (public.is_admin());

drop policy if exists "admins update all profiles" on profiles;
create policy "admins update all profiles"
  on profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Users may see their own outbound clicks; the analytics tables stay staff-only
-- through the service role.
drop policy if exists "users read their own clicks" on click_events;
create policy "users read their own clicks"
  on click_events for select
  using (user_id = auth.uid());
