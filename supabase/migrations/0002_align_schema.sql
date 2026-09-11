-- Reconcile an existing database with the schema in 0001_init.sql.
--
-- 0001 uses `create table if not exists`, which skips a table that was created
-- by an earlier, narrower version of the schema and leaves it missing columns.
-- This migration adds every column, constraint, and index the application
-- expects, so it is safe on a fresh database (all no-ops) and on one that was
-- built before the schema was committed.

-- ---------------------------------------------------------------------------
-- auction_sources
-- ---------------------------------------------------------------------------
alter table auction_sources add column if not exists name text;
alter table auction_sources add column if not exists website_url text;
alter table auction_sources add column if not exists logo_url text;
alter table auction_sources add column if not exists description text;
alter table auction_sources add column if not exists geographic_coverage text;
alter table auction_sources add column if not exists integration_type text;
alter table auction_sources add column if not exists api_endpoint text;
alter table auction_sources add column if not exists status text default 'pending';
alter table auction_sources add column if not exists is_featured boolean default false;
alter table auction_sources add column if not exists is_sponsored boolean default false;
alter table auction_sources add column if not exists last_synced_at timestamptz;
alter table auction_sources add column if not exists created_at timestamptz default now();

alter table auction_sources drop constraint if exists auction_sources_integration_type_check;
alter table auction_sources add constraint auction_sources_integration_type_check
  check (integration_type in ('api','rss','xml','csv','manual','ftp','email','google_sheets'));

alter table auction_sources drop constraint if exists auction_sources_status_check;
alter table auction_sources add constraint auction_sources_status_check
  check (status in ('active','inactive','pending'));

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
alter table listings add column if not exists external_id text;
alter table listings add column if not exists source_id uuid references auction_sources(id);
alter table listings add column if not exists title text;
alter table listings add column if not exists equipment_category text default 'tractor';
alter table listings add column if not exists make text;
alter table listings add column if not exists model text;
alter table listings add column if not exists year int;
alter table listings add column if not exists horsepower int;
alter table listings add column if not exists hours int;
alter table listings add column if not exists condition text;
alter table listings add column if not exists drive_type text;
alter table listings add column if not exists serial_number text;
alter table listings add column if not exists lot_number text;
alter table listings add column if not exists location_city text;
alter table listings add column if not exists location_state text;
alter table listings add column if not exists location_zip text;
alter table listings add column if not exists location_lat numeric;
alter table listings add column if not exists location_lng numeric;
alter table listings add column if not exists auction_company text;
alter table listings add column if not exists auction_end_date timestamptz;
alter table listings add column if not exists auction_type text;
alter table listings add column if not exists current_bid numeric;
alter table listings add column if not exists buy_it_now_price numeric;
alter table listings add column if not exists description text;
alter table listings add column if not exists images jsonb default '[]';
alter table listings add column if not exists original_url text;
alter table listings add column if not exists seller_info jsonb;
alter table listings add column if not exists is_featured boolean default false;
alter table listings add column if not exists is_sponsored boolean default false;
alter table listings add column if not exists sponsored_rank int;
alter table listings add column if not exists status text default 'active';
alter table listings add column if not exists sold_price numeric;
alter table listings add column if not exists sold_date timestamptz;
alter table listings add column if not exists last_synced_at timestamptz;
alter table listings add column if not exists created_at timestamptz default now();
alter table listings add column if not exists updated_at timestamptz default now();

alter table listings drop constraint if exists listings_status_check;
alter table listings add constraint listings_status_check
  check (status in ('active','expired','sold'));

-- Deduplication key for ingestion: one row per external listing per source.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_source_id_external_id_key'
  ) then
    alter table listings add constraint listings_source_id_external_id_key
      unique (source_id, external_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- click_events
-- ---------------------------------------------------------------------------
alter table click_events add column if not exists listing_id uuid references listings(id);
alter table click_events add column if not exists source_id uuid references auction_sources(id);
alter table click_events add column if not exists user_id uuid references profiles(id);
alter table click_events add column if not exists clicked_at timestamptz default now();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists listings_make_idx on listings(make);
create index if not exists listings_model_idx on listings(model);
create index if not exists listings_status_idx on listings(status);
create index if not exists listings_auction_end_date_idx on listings(auction_end_date);
create index if not exists listings_source_id_idx on listings(source_id);
create index if not exists listings_is_featured_idx on listings(is_featured);
create index if not exists listings_location_state_idx on listings(location_state);
create index if not exists listings_equipment_category_idx on listings(equipment_category);

-- ---------------------------------------------------------------------------
-- Row level security (re-asserted in case the tables predate 0001)
-- ---------------------------------------------------------------------------
alter table auction_sources enable row level security;
alter table listings enable row level security;
alter table click_events enable row level security;

drop policy if exists "auction_sources are publicly readable" on auction_sources;
create policy "auction_sources are publicly readable"
  on auction_sources for select
  using (true);

drop policy if exists "listings are publicly readable" on listings;
create policy "listings are publicly readable"
  on listings for select
  using (true);

drop policy if exists "anyone can record a click" on click_events;
create policy "anyone can record a click"
  on click_events for insert
  with check (true);
