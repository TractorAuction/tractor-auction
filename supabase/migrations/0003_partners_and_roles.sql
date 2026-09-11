-- Partner Center, admin roles, and sponsored-placement counters.
--
-- CLAUDE.md's schema covers listings, sources, and the outreach CRM but has no
-- table behind the Partner Center (Day 13), and no way to tell an admin from a
-- visitor (Day 15). Both are added here.

-- ---------------------------------------------------------------------------
-- Roles
--
-- Admin access is a column on profiles rather than a separate table: there are
-- only three roles and every RLS policy needs to read it on each request.
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists role text default 'user';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'partner'));

create index if not exists profiles_role_idx on profiles(role);

-- ---------------------------------------------------------------------------
-- Align the tables 0002 did not cover
--
-- 0002 reconciled auction_sources, listings and click_events. The remaining
-- tables from 0001 have the same problem: if they were created by an earlier,
-- narrower schema, `create table if not exists` left them short of columns.
-- Everything the application reads or writes is added here before any index,
-- constraint or policy depends on it.
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists email text;
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists created_at timestamptz default now();

alter table watchlist_items add column if not exists user_id uuid references profiles(id) on delete cascade;
alter table watchlist_items add column if not exists listing_id uuid references listings(id) on delete cascade;
alter table watchlist_items add column if not exists created_at timestamptz default now();

-- One row per user per listing, so the watchlist toggle can upsert (Day 8).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'watchlist_items_user_id_listing_id_key'
  ) then
    alter table watchlist_items add constraint watchlist_items_user_id_listing_id_key
      unique (user_id, listing_id);
  end if;
end $$;

alter table saved_searches add column if not exists user_id uuid references profiles(id) on delete cascade;
alter table saved_searches add column if not exists name text;
alter table saved_searches add column if not exists filters jsonb;
alter table saved_searches add column if not exists alert_enabled boolean default false;
alter table saved_searches add column if not exists last_alerted_at timestamptz;
alter table saved_searches add column if not exists created_at timestamptz default now();

alter table outreach_contacts add column if not exists company_name text;
alter table outreach_contacts add column if not exists website_url text;
alter table outreach_contacts add column if not exists contact_name text;
alter table outreach_contacts add column if not exists contact_email text;
alter table outreach_contacts add column if not exists contact_phone text;
alter table outreach_contacts add column if not exists geographic_coverage text;
alter table outreach_contacts add column if not exists inventory_type text;
alter table outreach_contacts add column if not exists existing_api_info text;
alter table outreach_contacts add column if not exists status text default 'pending';
alter table outreach_contacts add column if not exists outreach_date timestamptz;
alter table outreach_contacts add column if not exists follow_up_date timestamptz;
alter table outreach_contacts add column if not exists response_date timestamptz;
alter table outreach_contacts add column if not exists notes text;
alter table outreach_contacts add column if not exists source_id uuid references auction_sources(id);
alter table outreach_contacts add column if not exists created_at timestamptz default now();

-- The old status list was shorter than the pipeline the CRM now uses.
alter table outreach_contacts drop constraint if exists outreach_contacts_status_check;
alter table outreach_contacts add constraint outreach_contacts_status_check
  check (status in (
    'pending','contacted','follow_up','responded',
    'api_requested','api_received','integration_pending',
    'integrated','declined','no_response'
  ));

alter table sponsored_placements add column if not exists listing_id uuid references listings(id);
alter table sponsored_placements add column if not exists source_id uuid references auction_sources(id);
alter table sponsored_placements add column if not exists placement_type text;
alter table sponsored_placements add column if not exists start_date timestamptz;
alter table sponsored_placements add column if not exists end_date timestamptz;
alter table sponsored_placements add column if not exists impressions int default 0;
alter table sponsored_placements add column if not exists clicks int default 0;
alter table sponsored_placements add column if not exists is_active boolean default true;
alter table sponsored_placements add column if not exists created_at timestamptz default now();

alter table sponsored_placements drop constraint if exists sponsored_placements_placement_type_check;
alter table sponsored_placements add constraint sponsored_placements_placement_type_check
  check (placement_type in (
    'featured_listing','sponsored_listing','banner',
    'featured_source','category_sponsor','homepage'
  ));

alter table auction_results add column if not exists listing_id uuid references listings(id);
alter table auction_results add column if not exists source_id uuid references auction_sources(id);
alter table auction_results add column if not exists make text;
alter table auction_results add column if not exists model text;
alter table auction_results add column if not exists year int;
alter table auction_results add column if not exists horsepower int;
alter table auction_results add column if not exists hours int;
alter table auction_results add column if not exists sold_price numeric;
alter table auction_results add column if not exists sold_date timestamptz;
alter table auction_results add column if not exists auction_company text;
alter table auction_results add column if not exists location_state text;
alter table auction_results add column if not exists original_url text;
alter table auction_results add column if not exists created_at timestamptz default now();

-- ---------------------------------------------------------------------------
-- Partners
--
-- A partner application exists before the applicant has an account, so user_id
-- is nullable and gets linked once they register.
-- ---------------------------------------------------------------------------
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  company_name text not null,
  contact_name text,
  contact_email text not null,
  contact_phone text,
  website_url text,
  geographic_coverage text,
  inventory_type text,
  listings_per_month text,
  feed_url text,
  feed_type text check (feed_type in ('api','rss','xml','csv','manual','ftp','email','google_sheets')),
  status text default 'pending' check (status in ('pending','approved','rejected','suspended')),
  source_id uuid references auction_sources(id),
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists partners_status_idx on partners(status);
create index if not exists partners_user_id_idx on partners(user_id);

-- Listings a partner submits by hand, held for review before they go live.
create table if not exists partner_submissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) on delete cascade,
  title text not null,
  equipment_category text default 'tractor',
  make text,
  model text,
  year int,
  horsepower int,
  hours int,
  condition text,
  location_city text,
  location_state text,
  auction_end_date timestamptz,
  current_bid numeric,
  description text,
  original_url text not null,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  listing_id uuid references listings(id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists partner_submissions_partner_id_idx on partner_submissions(partner_id);
create index if not exists partner_submissions_status_idx on partner_submissions(status);

-- ---------------------------------------------------------------------------
-- Outreach CRM
--
-- One row per company, so re-running the prospect seed updates rather than
-- duplicating the queue.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'outreach_contacts_company_name_key'
  ) then
    alter table outreach_contacts add constraint outreach_contacts_company_name_key
      unique (company_name);
  end if;
end $$;

create index if not exists outreach_contacts_status_idx on outreach_contacts(status);
create index if not exists outreach_contacts_follow_up_date_idx on outreach_contacts(follow_up_date);

-- ---------------------------------------------------------------------------
-- Sponsored placements
-- ---------------------------------------------------------------------------
create index if not exists sponsored_placements_is_active_idx on sponsored_placements(is_active);
create index if not exists sponsored_placements_placement_type_idx on sponsored_placements(placement_type);
create index if not exists listings_is_sponsored_idx on listings(is_sponsored);
create index if not exists listings_sponsored_rank_idx on listings(sponsored_rank);

-- Impressions are counted from page renders, so the increment has to be atomic
-- and callable by an anonymous visitor without granting update on the table.
create or replace function increment_placement_impressions(placement_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update sponsored_placements
  set impressions = impressions + 1
  where id = any(placement_ids);
$$;

grant execute on function increment_placement_impressions(uuid[]) to anon, authenticated;

-- Same treatment for placement clicks, incremented by the outbound click tracker.
create or replace function increment_placement_clicks(target_listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update sponsored_placements
  set clicks = clicks + 1
  where listing_id = target_listing_id
    and is_active = true;
$$;

grant execute on function increment_placement_clicks(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table partners enable row level security;
alter table partner_submissions enable row level security;
alter table sponsored_placements enable row level security;
alter table outreach_contacts enable row level security;
alter table profiles enable row level security;

-- Anyone may apply to become a partner; only staff (service role) may read the
-- queue, so applications are write-only to the public.
drop policy if exists "anyone can apply to be a partner" on partners;
create policy "anyone can apply to be a partner"
  on partners for insert
  with check (true);

drop policy if exists "partners read their own record" on partners;
create policy "partners read their own record"
  on partners for select
  using (user_id = auth.uid());

drop policy if exists "partners manage their own submissions" on partner_submissions;
create policy "partners manage their own submissions"
  on partner_submissions for all
  using (
    partner_id in (select id from partners where user_id = auth.uid())
  )
  with check (
    partner_id in (select id from partners where user_id = auth.uid())
  );

-- Active placements are public so the front end can render and count them.
drop policy if exists "active placements are publicly readable" on sponsored_placements;
create policy "active placements are publicly readable"
  on sponsored_placements for select
  using (is_active = true);

drop policy if exists "profiles are readable by their owner" on profiles;
create policy "profiles are readable by their owner"
  on profiles for select
  using (id = auth.uid());

drop policy if exists "profiles are updatable by their owner" on profiles;
create policy "profiles are updatable by their owner"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- outreach_contacts carries prospect contact details and stays staff-only:
-- RLS is on with no public policy, so only the service role can reach it.
