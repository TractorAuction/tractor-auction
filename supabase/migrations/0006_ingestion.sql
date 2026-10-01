-- Day 6: ingestion pipeline.
--
-- Two things are added here:
--   1. Per-source feed configuration, so onboarding an authorized source is a
--      row edit rather than a code change. integration_type already says what
--      shape the feed is; feed_config says where it lives and how its fields
--      map onto the listings columns.
--   2. sync_runs, an audit row per ingestion attempt per source. Errors are
--      recorded per item rather than aborting the run, so one malformed listing
--      in a 2,000-row feed does not cost the other 1,999.

-- ---------------------------------------------------------------------------
-- Source feed configuration
-- ---------------------------------------------------------------------------
alter table auction_sources
  add column if not exists feed_config jsonb,
  -- Off by default: a source must be deliberately switched on once its feed is
  -- authorized and its field mapping has been verified against real payloads.
  add column if not exists sync_enabled boolean not null default false,
  add column if not exists sync_interval_minutes int not null default 360,
  add column if not exists last_sync_status text,
  add column if not exists last_sync_error text;

comment on column auction_sources.feed_config is
  'Connector config: { url, itemsPath, fieldMap, staticFields, pageParam, pageSize, maxPages, headers, authHeaderEnv }.';
comment on column auction_sources.sync_enabled is
  'Only enable once the feed is contractually authorized and the field mapping is verified.';

-- ---------------------------------------------------------------------------
-- Sync run audit log
-- ---------------------------------------------------------------------------
create table if not exists sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references auction_sources(id) on delete cascade,
  status text not null default 'running'
    check (status in ('running','success','partial','failed')),
  trigger text not null default 'cron' check (trigger in ('cron','manual','backfill')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms int,
  items_seen int not null default 0,
  items_created int not null default 0,
  items_updated int not null default 0,
  items_skipped int not null default 0,
  items_expired int not null default 0,
  -- Capped at a bounded number of entries by the writer: a feed that fails
  -- every row must not write an unbounded blob into this column.
  item_errors jsonb not null default '[]',
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists sync_runs_source_started_idx
  on sync_runs(source_id, started_at desc);
create index if not exists sync_runs_status_idx on sync_runs(status);

-- Listings carry the run that last touched them, which turns "why does this
-- row look wrong" into a single join instead of a guess.
alter table listings
  add column if not exists last_sync_run_id uuid references sync_runs(id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS: operational data, staff only. No public policy is defined, so the
-- anon/authenticated roles get nothing and the service-role worker bypasses RLS.
-- ---------------------------------------------------------------------------
alter table sync_runs enable row level security;
