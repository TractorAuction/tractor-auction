-- TractorAuction.com — initial schema
-- Mirrors the schema documented in CLAUDE.md. Run against a fresh Supabase project.
--
-- `create table if not exists` skips a table that already exists, so on a
-- database built before this file was committed some tables can be left missing
-- columns. Always run 0002_align_schema.sql after this one; it is a no-op on a
-- fresh database and fills in the gaps on an existing one.

-- ---------------------------------------------------------------------------
-- Auction sources / data partners
-- ---------------------------------------------------------------------------
create table if not exists auction_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text not null,
  logo_url text,
  description text,
  geographic_coverage text,
  integration_type text check (integration_type in ('api','rss','xml','csv','manual','ftp','email','google_sheets')),
  api_endpoint text,
  status text default 'pending' check (status in ('active','inactive','pending')),
  is_featured boolean default false,
  is_sponsored boolean default false,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source_id uuid references auction_sources(id),
  title text,
  equipment_category text default 'tractor',
  make text,
  model text,
  year int,
  horsepower int,
  hours int,
  condition text,
  drive_type text,
  serial_number text,
  lot_number text,
  location_city text,
  location_state text,
  location_zip text,
  location_lat numeric,
  location_lng numeric,
  auction_company text,
  auction_end_date timestamptz,
  auction_type text,
  current_bid numeric,
  buy_it_now_price numeric,
  description text,
  images jsonb default '[]',
  original_url text not null,
  seller_info jsonb,
  is_featured boolean default false,
  is_sponsored boolean default false,
  sponsored_rank int,
  status text default 'active' check (status in ('active','expired','sold')),
  sold_price numeric,
  sold_date timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(source_id, external_id)
);

-- ---------------------------------------------------------------------------
-- User accounts
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id),
  email text,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text,
  filters jsonb not null,
  alert_enabled boolean default false,
  last_alerted_at timestamptz,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Outreach CRM
-- ---------------------------------------------------------------------------
create table if not exists outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  website_url text,
  contact_name text,
  contact_email text,
  contact_phone text,
  geographic_coverage text,
  inventory_type text,
  existing_api_info text,
  status text default 'pending' check (status in (
    'pending','contacted','follow_up','responded',
    'api_requested','api_received','integration_pending',
    'integrated','declined','no_response'
  )),
  outreach_date timestamptz,
  follow_up_date timestamptz,
  response_date timestamptz,
  notes text,
  source_id uuid references auction_sources(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Outbound click tracking
-- ---------------------------------------------------------------------------
create table if not exists click_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  source_id uuid references auction_sources(id),
  user_id uuid references profiles(id),
  clicked_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Sponsored placements
-- ---------------------------------------------------------------------------
create table if not exists sponsored_placements (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  source_id uuid references auction_sources(id),
  placement_type text check (placement_type in (
    'featured_listing','sponsored_listing','banner',
    'featured_source','category_sponsor','homepage'
  )),
  start_date timestamptz,
  end_date timestamptz,
  impressions int default 0,
  clicks int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Historical auction results
-- ---------------------------------------------------------------------------
create table if not exists auction_results (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  source_id uuid references auction_sources(id),
  make text,
  model text,
  year int,
  horsepower int,
  hours int,
  sold_price numeric,
  sold_date timestamptz,
  auction_company text,
  location_state text,
  original_url text,
  created_at timestamptz default now()
);

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
-- Row level security
--
-- Listings and sources are the public catalogue: anyone may read them, and only
-- the service role (ingestion workers, admin) may write. Click events are
-- write-only for the public so the outbound tracker can record a click without
-- exposing the analytics table. Per-user tables are added with auth in 0002.
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
