-- Outreach CRM prospect list.
--
-- Source of truth: OUTREACH_SOURCES.md at the repo root. The tiers here match
-- that document exactly, and the tier drives both the email angle and the
-- integration method requested (see src/lib/outreach/templates.ts).
--
-- contact_email is deliberately left null. These are real businesses, and
-- guessing an address risks mail going to the wrong inbox or bouncing and
-- hurting the sending domain's reputation. Fill each one in from the company's
-- own contact or partnerships page as you work the queue; the admin UI at
-- /admin/outreach edits them inline and the send action refuses a blank one.
--
-- Companies that appear in two tiers are seeded once at their highest priority
-- (lowest tier number) and the overlap is recorded in notes.
--
-- Safe to re-run: keyed on company_name, and updates tier / integration data
-- without touching contact details or pipeline status you have already set.

insert into outreach_contacts (
  company_name, website_url, geographic_coverage, inventory_type,
  tier, integration_request, notes, status
)
values
  -- Tier 1 — highest priority. Large platforms likely to already have data
  -- infrastructure. Lead with traffic and buyer volume.
  ('EquipmentFacts', 'https://www.equipmentfacts.com', 'North America', 'Agricultural equipment auctions', 1, 'API or XML feed', null, 'pending'),
  ('AuctionTime', 'https://www.auctiontime.com', 'North America', 'Agricultural equipment auctions', 1, 'API or RSS feed', 'Sandhills Global property; shares inventory with TractorHouse and MarketBook.', 'pending'),
  ('BigIron Auctions', 'https://www.bigiron.com', 'North America', 'Farm and construction equipment', 1, 'API or XML feed', null, 'pending'),
  ('Purple Wave Auction', 'https://www.purplewave.com', 'North America', 'Agricultural and construction equipment', 1, 'API or XML feed', null, 'pending'),
  ('Ritchie Bros.', 'https://www.rbauction.com', 'North America', 'Heavy equipment and trucks', 1, 'Official API', 'Expect a formal partnerships process. IronPlanet is a subsidiary — may be one conversation.', 'pending'),
  ('IronPlanet', 'https://www.ironplanet.com', 'North America', 'Used heavy equipment', 1, 'Official API', 'Ritchie Bros. subsidiary.', 'pending'),
  ('BidSpotter', 'https://www.bidspotter.com', 'North America', 'Industrial and agricultural auctions', 1, 'API or RSS feed', null, 'pending'),
  ('Proxibid', 'https://www.proxibid.com', 'North America', 'Multi-category auctions', 1, 'API or XML feed', 'Hosts many independent auctioneers.', 'pending'),
  ('HiBid', 'https://www.hibid.com', 'North America', 'Multi-category auctions via Auction Flex', 1, 'API (Auction Flex integration)', 'Also a Tier 5 software provider: one integration reaches hundreds of independent auctioneers. Use the software-provider angle.', 'pending'),
  ('GovDeals', 'https://www.govdeals.com', 'United States', 'Government surplus equipment', 1, 'Public API or RSS', 'Also Tier 4. Lead with public visibility and transparency.', 'pending'),
  ('GSA Auctions', 'https://gsaauctions.gov', 'United States', 'Federal surplus equipment', 1, 'Public data feed', 'Also Tier 4. Lead with public visibility and transparency.', 'pending'),

  -- Tier 2 — farm-specific auction companies running their own platforms.
  -- Lead with reach beyond their regional audience.
  ('Steffes Group', 'https://www.steffesgroup.com', 'Midwest US', 'Farm equipment auctions', 2, 'CSV, RSS or XML feed', 'Strong ND/MN/IA presence.', 'pending'),
  ('Miedema Asset Management (1800LastBid)', 'https://www.1800lastbid.com', 'Midwest US', 'Farm equipment auctions', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Sullivan Auctioneers', 'https://www.sullivanauctioneers.com', 'Midwest US', 'Farm and construction auctions', 2, 'CSV, RSS or XML feed', 'High-volume farm retirement sales.', 'pending'),
  ('Wieman Land & Auction', 'https://www.wiemanauction.com', 'Midwest US', 'Farm equipment and land', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Aumann Auctions', 'https://www.aumannauctions.com', 'Midwest and International', 'Farm equipment auctions', 2, 'CSV, RSS or XML feed', 'Also listed under Tier 7 international. Notable for collector tractor sales.', 'pending'),
  ('Schrader Real Estate & Auction', 'https://www.schraderauction.com', 'Midwest US', 'Farm equipment and real estate', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Merit Auctions', 'https://www.meritauctions.com', 'Regional US', 'Agricultural equipment', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Mowrey Auction Company', 'https://www.mowreyauction.com', 'Regional US', 'Farm and equipment auctions', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Yoder & Frey', 'https://www.yoderandfrey.com', 'Ohio / Midwest', 'Farm equipment auctions', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Hansen Auction Group', 'https://www.hansenauctiongroup.com', 'Regional US', 'Agricultural equipment', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Zomer Company Realty & Auction', 'https://www.zomercompany.com', 'Iowa / Midwest', 'Farm equipment and real estate', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Pifer''s Auction & Realty', 'https://www.pifers.com', 'Northern Plains', 'Farm equipment and land', 2, 'CSV, RSS or XML feed', null, 'pending'),
  ('Witcher Auctions', 'https://www.witcherauctions.com', 'Regional US', 'Agricultural equipment', 2, 'CSV, RSS or XML feed', null, 'pending'),

  -- Tier 3 — regional auctioneers. Thousands of listings collectively.
  ('Maring Auction Company', 'https://www.maringauction.com', 'Regional US', 'Farm equipment', 3, 'CSV export or manual submission', null, 'pending'),
  ('Kramer Auction Service', 'https://www.kramerauction.com', 'Regional US', 'Farm equipment', 3, 'CSV export or manual submission', null, 'pending'),
  ('Girard Auction & Land Brokers', 'https://www.girardauction.com', 'Regional US', 'Farm equipment and land', 3, 'CSV export or manual submission', null, 'pending'),
  ('McGrew Equipment Auctions', 'https://www.mcgrewonlineauctions.com', 'Regional US', 'Agricultural equipment', 3, 'CSV export or manual submission', null, 'pending'),
  ('Vanderbrink Auctions', 'https://www.vanderbrinkauctions.com', 'Iowa / Midwest', 'Farm equipment and real estate', 3, 'CSV export or manual submission', null, 'pending'),

  -- Tier 4 — government and municipal. Public data is generally accessible.
  ('Public Surplus', 'https://www.publicsurplus.com', 'United States', 'Government surplus equipment', 4, 'Public API or RSS feed', null, 'pending'),
  ('Municibid', 'https://www.municibid.com', 'United States', 'Municipal surplus equipment', 4, 'Public API or RSS feed', null, 'pending'),

  -- Tier 5 — auction software providers. Highest leverage: one integration can
  -- unlock every auction company running on their platform.
  ('Wavebid', 'https://wavebid.com', 'North America', 'Auction software platform', 5, 'Partner API or white-label data feed', 'Auction management platform with many client auction houses.', 'pending'),
  ('BidJS', 'https://bidjs.com', 'Global', 'Auction software platform', 5, 'Partner API or white-label data feed', 'Used by regional auction companies.', 'pending'),
  ('Auction Mobility', 'https://www.auctionmobility.com', 'Global', 'White-label auction platform', 5, 'Partner API or white-label data feed', null, 'pending'),

  -- Tier 6 — mixed marketplaces. Some are competitors; approach carefully.
  ('MachineryTrader', 'https://www.machinerytrader.com', 'North America', 'Equipment marketplace with auction inventory', 6, 'Data partnership or cross-listing', 'Sandhills Global property. Possible competitor — approach carefully.', 'pending'),
  ('TractorHouse', 'https://www.tractorhouse.com', 'North America', 'Tractor listings and auctions', 6, 'Data partnership or cross-listing', 'Sandhills Global — likely the same contact as AuctionTime.', 'pending'),
  ('Fastline', 'https://www.fastline.com', 'United States', 'Farm equipment marketplace', 6, 'Data partnership or cross-listing', null, 'pending'),
  ('MarketBook', 'https://www.marketbook.com', 'North America', 'Equipment marketplace with auction inventory', 6, 'Data partnership or cross-listing', 'Sandhills Global property.', 'pending'),
  ('Machinio', 'https://www.machinio.com', 'Global', 'Equipment marketplace', 6, 'Data partnership or cross-listing', 'Possible competitor — approach carefully.', 'pending'),

  -- Tier 7 — international. Contact after US coverage is established (Phase 2).
  ('Euro Auctions', 'https://www.euroauctions.com', 'UK / Europe', 'Heavy and agricultural equipment', 7, 'International data feed or API', 'Phase 2. Request US-relevant inventory only.', 'pending'),
  ('Cheffins', 'https://www.cheffins.co.uk', 'UK', 'Agricultural machinery auctions', 7, 'International data feed or API', 'Phase 2.', 'pending'),
  ('Pickles Auctions', 'https://www.pickles.com.au', 'Australia', 'Equipment and vehicle auctions', 7, 'International data feed or API', 'Phase 2.', 'pending'),
  ('AllSurplus', 'https://www.allsurplus.com', 'Global', 'Surplus and industrial equipment', 7, 'International data feed or API', 'Phase 2. Liquidity Services marketplace.', 'pending')
on conflict (company_name) do update set
  website_url = excluded.website_url,
  geographic_coverage = excluded.geographic_coverage,
  inventory_type = excluded.inventory_type,
  tier = excluded.tier,
  integration_request = excluded.integration_request,
  -- Keep any research already done: only fill notes when the row has none.
  notes = coalesce(outreach_contacts.notes, excluded.notes);
