-- Outreach CRM prospect list.
--
-- contact_email is deliberately left null. These are real businesses, and
-- guessing an address risks mail going to the wrong inbox or bouncing and
-- hurting the sending domain's reputation. Fill each one in from the company's
-- own contact or partnerships page as you work the queue; the admin UI at
-- /admin/outreach edits them inline and the send action refuses a blank one.
--
-- Safe to re-run: keyed on company_name.

insert into outreach_contacts (company_name, website_url, geographic_coverage, inventory_type, notes, status)
values
  -- Tier 1: named in the SOW as connector or outreach targets
  ('EquipmentFacts', 'https://www.equipmentfacts.com', 'United States', 'Farm and construction equipment', 'SOW priority 1. Aggregator with existing feed infrastructure.', 'pending'),
  ('AuctionTime', 'https://www.auctiontime.com', 'United States, Canada', 'Farm equipment, trucks, trailers', 'SOW priority 2. Sandhills Global property, shares inventory with TractorHouse.', 'pending'),
  ('BigIron Auctions', 'https://www.bigiron.com', 'United States', 'Farm equipment, unreserved online', 'SOW priority 3. Weekly Wednesday sales.', 'pending'),
  ('Purple Wave', 'https://www.purplewave.com', 'United States', 'Agricultural and construction equipment', 'SOW priority 4. No-reserve model, high listing volume.', 'pending'),
  ('Ritchie Bros.', 'https://www.rbauction.com', 'Global', 'Industrial and agricultural equipment', 'SOW priority 5. Largest player; expect a formal partnerships process.', 'pending'),
  ('IronPlanet', 'https://www.ironplanet.com', 'Global', 'Heavy equipment, agricultural', 'SOW priority 6. Ritchie Bros. subsidiary — may be one conversation with #5.', 'pending'),
  ('Proxibid', 'https://www.proxibid.com', 'United States', 'Multi-category marketplace incl. farm equipment', 'SOW priority 7. Hosts many independent auctioneers.', 'pending'),
  ('HiBid', 'https://www.hibid.com', 'United States, Canada', 'Multi-category auction network', 'SOW priority 8. Auction Flex network; one integration reaches many houses.', 'pending'),
  ('BidSpotter', 'https://www.bidspotter.com', 'United States, United Kingdom', 'Industrial and agricultural', 'SOW priority 9.', 'pending'),
  ('Steffes Group', 'https://www.steffesgroup.com', 'Upper Midwest', 'Farm equipment, land', 'SOW priority 10. Strong ND/MN/IA presence.', 'pending'),

  -- Regional farm auction houses
  ('Sullivan Auctioneers', 'https://www.sullivanauctioneers.com', 'Illinois, Iowa, Missouri', 'Farm equipment, land', 'High-volume Midwest farm retirement sales.', 'pending'),
  ('Aumann Auctions', 'https://www.aumannauctions.com', 'United States', 'Antique and late-model farm equipment', 'Notable for collector tractor sales.', 'pending'),
  ('Wieman Land & Auction', 'https://www.wiemanauction.com', 'South Dakota, Nebraska', 'Farm equipment, land', null, 'pending'),
  ('Girard Auction & Land Brokers', 'https://www.girardauction.com', 'South Dakota', 'Farm equipment, land', null, 'pending'),
  ('Schrader Real Estate and Auction', 'https://schraderauction.com', 'Indiana, Midwest', 'Farmland, equipment', null, 'pending'),
  ('Halderman Real Estate and Farm Management', 'https://www.halderman.com', 'Indiana, Ohio, Illinois', 'Farmland, equipment', null, 'pending'),
  ('Farmers National Company', 'https://www.farmersnational.com', 'United States', 'Farmland, equipment', 'Large farm management company with auction arm.', 'pending'),
  ('Hansen Auction Group', 'https://www.hansenauctiongroup.com', 'Wisconsin, Minnesota', 'Farm equipment', null, 'pending'),
  ('Musser Bros. Auctions', 'https://www.mbauction.com', 'Montana, Wyoming, Idaho', 'Farm and construction equipment', null, 'pending'),
  ('Assiter Auctioneers', 'https://www.assiter.com', 'Texas, Southwest', 'Farm equipment, land', null, 'pending'),
  ('Kaufman Auctions', 'https://www.kaufmanauctions.com', 'Kansas', 'Farm equipment, land', null, 'pending'),
  ('Lippard Auctioneers', 'https://www.lippardauctions.com', 'Oklahoma, Kansas, Texas', 'Farm equipment', null, 'pending'),
  ('Roller Auctions', 'https://www.rollerauction.com', 'Colorado, Mountain West', 'Equipment, vehicles', null, 'pending'),
  ('Alex Lyon & Son', 'https://www.lyonauction.com', 'United States', 'Heavy equipment, agricultural', null, 'pending'),
  ('Yoder & Frey', 'https://www.yoderandfrey.com', 'United States', 'Heavy equipment', null, 'pending'),
  ('J.M. Wood Auction Company', 'https://www.jmwood.com', 'Alabama, Southeast', 'Construction and farm equipment', null, 'pending'),
  ('Jeff Martin Auctioneers', 'https://www.jeffmartinauctioneers.com', 'Southeast United States', 'Farm and construction equipment', null, 'pending'),
  ('Deanco Auction', 'https://www.deancoauction.com', 'Mississippi, Southeast', 'Farm and construction equipment', null, 'pending'),
  ('Taylor & Martin Group', 'https://www.taylorandmartin.com', 'United States', 'Trucks, trailers, equipment', null, 'pending'),
  ('Smith Sales Co. Auctioneers', 'https://www.smithsales.net', 'Idaho, Pacific Northwest', 'Farm equipment', null, 'pending'),
  ('Bar None Auction', 'https://www.barnoneauction.com', 'California, Oregon', 'Equipment, fleet, agricultural', null, 'pending'),
  ('Ayres Auction & Real Estate', 'https://www.ayresauction.com', 'Tennessee', 'Farm equipment, land', null, 'pending'),
  ('Gehling Auction Company', 'https://www.gehlingauction.com', 'Minnesota, Iowa', 'Farm equipment', null, 'pending'),
  ('Ruhter Auction & Realty', 'https://www.ruhterauction.com', 'Nebraska', 'Farm equipment, land', null, 'pending'),
  ('Bradeen Auctions', 'https://www.bradeenauction.com', 'South Dakota', 'Farm equipment, land', null, 'pending'),
  ('Pifer''s Auction & Realty', 'https://www.pifers.com', 'North Dakota, Minnesota', 'Farmland, equipment', null, 'pending'),
  ('Peoples Company', 'https://peoplescompany.com', 'Iowa, Midwest', 'Farmland, equipment', null, 'pending'),
  ('Sold By Rob', 'https://www.soldbyrob.com', 'Indiana, Ohio', 'Farm equipment', null, 'pending'),
  ('Kiko Auctioneers', 'https://www.kikoauctions.com', 'Ohio', 'Farm equipment, real estate', null, 'pending'),
  ('Beck Auctioneers', 'https://www.beckauctioneers.com', 'Illinois', 'Farm equipment', null, 'pending'),

  -- Marketplaces and data aggregators
  ('TractorHouse', 'https://www.tractorhouse.com', 'United States, Canada', 'Tractor listings and auctions', 'Sandhills Global — likely the same contact as AuctionTime.', 'pending'),
  ('Tractor Zoom', 'https://www.tractorzoom.com', 'United States', 'Auction aggregation and pricing data', 'Direct aggregator peer. May be competitor or data partner.', 'pending'),
  ('Machinery Pete', 'https://www.machinerypete.com', 'United States', 'Auction results and pricing data', 'Strong brand in auction price history.', 'pending'),
  ('Fastline', 'https://www.fastline.com', 'United States', 'Farm equipment marketplace', null, 'pending'),
  ('AgDealer', 'https://www.agdealer.com', 'Canada', 'Farm equipment marketplace', 'Canadian coverage gap filler.', 'pending'),
  ('Equipment Trader', 'https://www.equipmenttrader.com', 'United States', 'Equipment marketplace', null, 'pending')
on conflict (company_name) do nothing;
