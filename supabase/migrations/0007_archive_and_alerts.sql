-- Day 9 (email alerts) + Day 14 (auction_results archive).
--
-- Three additions, unrelated to each other except that both features needed a
-- migration this session:
--   1. A unique index on auction_results(listing_id), so archiving is a plain
--      upsert instead of a fetch-existing-ids-then-filter dance.
--   2. watchlist_items.ending_alert_sent_at, so the "auction ends within 24h"
--      alert fires once per listing per user, not once per cron tick.
--   3. profiles.email_alerts_enabled, the unsubscribe target. One flag covers
--      saved-search and watchlist alerts; real per-category prefs can split
--      this later without a migration most users will never touch.

-- ---------------------------------------------------------------------------
-- auction_results: dedupe on the listing it was archived from
-- ---------------------------------------------------------------------------
-- A listing can only be archived once; null listing_id (a manually-entered
-- historical result with no matching row) is exempt from the constraint.
create unique index if not exists auction_results_listing_id_key
  on auction_results(listing_id) where listing_id is not null;

-- ---------------------------------------------------------------------------
-- watchlist_items: track the ending-soon alert per item
-- ---------------------------------------------------------------------------
alter table watchlist_items
  add column if not exists ending_alert_sent_at timestamptz;

-- ---------------------------------------------------------------------------
-- profiles: global alert opt-out, set from the one-click unsubscribe link
-- ---------------------------------------------------------------------------
alter table profiles
  add column if not exists email_alerts_enabled boolean not null default true;
