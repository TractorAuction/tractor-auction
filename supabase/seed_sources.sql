-- Feed configuration for the priority auction sources.
--
-- AUTHORIZATION STATUS. Every source here is sync_enabled = false on purpose.
-- The connector framework is format-driven, so each one goes live by flipping
-- that flag once its feed is contractually authorized — no code change. What is
-- blocking each one, as checked on 2026-10-01:
--
--   BigIron          Cloudflare returns 403 to automated requests, including to
--                    /robots.txt. There is no public feed, and getting past bot
--                    protection is out of bounds. Outreach only.
--   AuctionTime      robots.txt permits listing pages, but it is a Sandhills
--                    property and republishing its inventory commercially needs a
--                    Sandhills partner feed. Field map below assumes their
--                    standard XML export; verify against the real payload.
--   Purple Wave      robots.txt publishes a sitemap and permits item pages, but
--                    explicitly disallows /v1/ (their API). Needs a data
--                    agreement before ingestion.
--   EquipmentFacts   No public feed located. Outreach first.
--
-- Run supabase/migrations/0006_ingestion.sql before this file.
--
-- Mappings are written out now so that onboarding a feed is "paste the real URL,
-- preview the mapping, flip the flag" rather than a from-scratch exercise under
-- deadline. Always preview before enabling:
--
--   curl -X POST https://www.tractorauction.com/api/ingest/preview \
--     -H "authorization: Bearer $CRON_SECRET" \
--     -H "content-type: application/json" \
--     -d '{"integration_type":"csv","feed_config":{ ... }}'

-- ---------------------------------------------------------------------------
-- AuctionTime: XML export (shape to be confirmed against the real feed)
-- ---------------------------------------------------------------------------
update auction_sources set
  integration_type = 'xml',
  sync_enabled = false,
  sync_interval_minutes = 360,
  feed_config = jsonb_build_object(
    'url', null,
    'itemsPath', 'listings.listing',
    'fieldMap', jsonb_build_object(
      'external_id', 'listingId',
      'title', 'title',
      'make', 'manufacturer',
      'model', 'model',
      'year', 'year',
      'horsepower', 'horsepower',
      'hours', 'hours',
      'condition', 'condition',
      'drive_type', 'driveType',
      'serial_number', 'serialNumber',
      'lot_number', 'lotNumber',
      'location_city', 'city',
      'location_state', 'state',
      'auction_end_date', 'auctionEndDate',
      'auction_type', 'auctionType',
      'current_bid', 'currentBid',
      'description', 'description',
      'images', 'images.image',
      'original_url', 'detailUrl'
    ),
    'staticFields', jsonb_build_object('auction_company', 'AuctionTime')
  )
where id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------------
-- BigIron: blocked at the edge, no feed. Config left empty deliberately.
-- ---------------------------------------------------------------------------
update auction_sources set
  sync_enabled = false,
  last_sync_status = null,
  last_sync_error = 'No authorized feed. Cloudflare blocks automated access; pending outreach.'
where id = '22222222-2222-2222-2222-222222222222';

-- ---------------------------------------------------------------------------
-- Purple Wave: JSON once a data agreement is in place.
-- ---------------------------------------------------------------------------
update auction_sources set
  integration_type = 'api',
  sync_enabled = false,
  sync_interval_minutes = 360,
  feed_config = jsonb_build_object(
    'url', null,
    'itemsPath', 'items',
    'pageParam', 'page',
    'pageSizeParam', 'per_page',
    'pageSize', 100,
    'maxPages', 50,
    'fieldMap', jsonb_build_object(
      'external_id', 'item_id',
      'title', 'title',
      'make', 'make',
      'model', 'model',
      'year', 'year',
      'horsepower', 'horsepower',
      'hours', 'hours',
      'location_city', 'city',
      'location_state', 'state',
      'auction_end_date', 'close_date',
      'current_bid', 'high_bid',
      'description', 'description',
      'images', 'photos',
      'original_url', 'url'
    ),
    'staticFields', jsonb_build_object('auction_company', 'Purple Wave')
  )
where id = '33333333-3333-3333-3333-333333333333';

-- ---------------------------------------------------------------------------
-- Ritchie Bros.: outreach first, per the SOW source table.
-- ---------------------------------------------------------------------------
update auction_sources set
  sync_enabled = false,
  last_sync_error = 'Outreach first; no feed agreement yet.'
where id = '44444444-4444-4444-4444-444444444444';

-- ---------------------------------------------------------------------------
-- Partner CSV: the path that works without any third-party agreement.
--
-- A partner or the client publishes a sheet, shares it as CSV, and this source
-- ingests it. This is the one connector that can legitimately be switched on
-- today: set feed_config->>'url' to the export URL and sync_enabled = true.
-- For Google Sheets use File -> Share -> Publish to web -> CSV, which gives a
-- URL of the form:
--   https://docs.google.com/spreadsheets/d/<id>/export?format=csv&gid=<gid>
-- ---------------------------------------------------------------------------
insert into auction_sources (
  id, name, website_url, description, geographic_coverage,
  integration_type, status, is_featured, sync_enabled, sync_interval_minutes, feed_config
)
values (
  '55555555-5555-5555-5555-555555555555',
  'Partner Feed (CSV)',
  'https://www.tractorauction.com/partner',
  'Direct submissions from partner auction houses via published CSV or Google Sheet.',
  'United States',
  'csv',
  'active',
  false,
  false,
  60,
  jsonb_build_object(
    'url', null,
    'fieldMap', jsonb_build_object(
      'external_id', 'lot_id',
      'title', 'title',
      'equipment_category', 'category',
      'make', 'make',
      'model', 'model',
      'year', 'year',
      'horsepower', 'horsepower',
      'hours', 'hours',
      'condition', 'condition',
      'drive_type', 'drive_type',
      'serial_number', 'serial_number',
      'lot_number', 'lot_number',
      'location_city', 'city',
      'location_state', 'state',
      'location_zip', 'zip',
      'auction_company', 'auction_company',
      'auction_end_date', 'auction_end_date',
      'auction_type', 'auction_type',
      'current_bid', 'current_bid',
      'buy_it_now_price', 'buy_it_now_price',
      'description', 'description',
      'images', 'image_urls',
      'original_url', 'listing_url'
    )
  )
)
on conflict (id) do update set
  integration_type = excluded.integration_type,
  feed_config = excluded.feed_config,
  sync_interval_minutes = excluded.sync_interval_minutes;
