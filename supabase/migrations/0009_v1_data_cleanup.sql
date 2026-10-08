-- V1 fix list, Priority 1.
--
--   1. Remove the 30 development seed listings (supabase/seed.sql). Their
--      original_url values were invented (auctiontime.com/listing/AT-8842401 and
--      so on), so every "View Auction" click on them landed on a 404 or a bot
--      wall, and they inflated the homepage inventory count. They are deleted
--      rather than expired: expiring would let archiveEndedListings() copy their
--      made-up bids into auction_results as fake sale history.
--   2. Seed sources with no authorized feed go back to 'pending', so they stop
--      appearing as live sources in filters and on the homepage.
--   3. Outbound link verification columns for the link checker
--      (lib/listings/verify-links.ts).

-- ---------------------------------------------------------------------------
-- 1. Seed listings
--
-- Identified by the four fixed seed source ids AND never having been touched by
-- an ingestion run, so a real listing that later arrives through an authorized
-- feed for one of these sources is never caught by this.
-- ---------------------------------------------------------------------------
-- Tables whose listing_id has no ON DELETE action would block the delete, so
-- their rows go first. The predicate is repeated rather than held in a temp
-- table so this runs the same in the SQL editor and through the CLI.
delete from click_events where listing_id in (
  select id from listings
  where source_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444')
    and last_sync_run_id is null
);
delete from sponsored_placements where listing_id in (
  select id from listings
  where source_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444')
    and last_sync_run_id is null
);
delete from auction_results where listing_id in (
  select id from listings
  where source_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444')
    and last_sync_run_id is null
);
delete from listings
where source_id in ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444444')
  and last_sync_run_id is null;

-- ---------------------------------------------------------------------------
-- 2. Seed sources without an authorized feed
-- ---------------------------------------------------------------------------
update auction_sources
set status = 'pending'
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
)
and sync_enabled = false;

-- ---------------------------------------------------------------------------
-- 3. Outbound link verification
-- ---------------------------------------------------------------------------
alter table listings
  add column if not exists last_verified_at timestamptz,
  -- 'ok'          the auction page answered 2xx/3xx
  -- 'dead'        404 or 410; the listing is expired by the checker
  -- 'unverified'  bot wall (403/429), 5xx or timeout; says nothing either way
  add column if not exists link_status text
    check (link_status in ('ok','dead','unverified'));

create index if not exists listings_last_verified_at_idx
  on listings(last_verified_at nulls first)
  where status = 'active';
