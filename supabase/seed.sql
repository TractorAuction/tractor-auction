-- Development seed data for TractorAuction.com
-- Four auction sources and 30 listings, enough to exercise search, filters,
-- sorting, pagination, and the featured/sponsored placements.
--
-- Auction end dates are relative to now() so the countdown and "ending soon"
-- states stay demonstrable however long after seeding the app is opened.
--
-- Safe to re-run: sources are keyed by fixed UUIDs and listings by
-- (source_id, external_id), both of which upsert.

-- ---------------------------------------------------------------------------
-- Sources
-- ---------------------------------------------------------------------------
insert into auction_sources (id, name, website_url, logo_url, description, geographic_coverage, integration_type, status, is_featured)
values
  ('11111111-1111-1111-1111-111111111111', 'AuctionTime', 'https://www.auctiontime.com', '/sites/AuctionTime.svg', 'Weekly online equipment auctions across North America.', 'United States, Canada', 'manual', 'active', true),
  ('22222222-2222-2222-2222-222222222222', 'BigIron Auctions', 'https://www.bigiron.com', null, 'Unreserved online farm equipment auctions.', 'United States', 'manual', 'active', false),
  ('33333333-3333-3333-3333-333333333333', 'Purple Wave', 'https://www.purplewave.com', '/sites/Purple-Wave.svg', 'No-reserve online auctions for agricultural and construction equipment.', 'United States', 'manual', 'active', false),
  ('44444444-4444-4444-4444-444444444444', 'Ritchie Bros.', 'https://www.rbauction.com', '/sites/Ritchie Bros.svg', 'Global industrial and agricultural auctioneer.', 'Global', 'manual', 'active', false)
on conflict (id) do update set
  name = excluded.name,
  website_url = excluded.website_url,
  logo_url = excluded.logo_url,
  description = excluded.description,
  geographic_coverage = excluded.geographic_coverage,
  integration_type = excluded.integration_type,
  status = excluded.status,
  is_featured = excluded.is_featured;

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
insert into listings (
  source_id, external_id, title, equipment_category, make, model, year,
  horsepower, hours, condition, drive_type, serial_number, lot_number,
  location_city, location_state, auction_company, auction_end_date, auction_type,
  current_bid, buy_it_now_price, description, images, original_url,
  is_featured, is_sponsored, sponsored_rank, status
)
select
  s.id,
  v.external_id,
  v.title,
  v.equipment_category,
  v.make,
  v.model,
  v.year,
  v.horsepower,
  v.hours,
  v.condition,
  v.drive_type,
  v.serial_number,
  v.lot_number,
  v.location_city,
  v.location_state,
  s.name,
  now() + (v.ends_in_hours || ' hours')::interval,
  v.auction_type,
  v.current_bid,
  v.buy_it_now_price,
  v.description,
  '[]'::jsonb,
  v.original_url,
  v.is_featured,
  v.is_sponsored,
  v.sponsored_rank,
  'active'
from (values
  -- source_key, external_id, title, category, make, model, year, hp, hours, condition, drive, serial, lot, city, state, ends_in_hours, auction_type, current_bid, bin, description, url, featured, sponsored, rank
  ('auctiontime', 'AT-8841203', '2021 John Deere 8R 340',     'tractor', 'John Deere',  '8R 340',      2021, 340, 1250, 'Used', 'MFWD',  '1RW8R34ACMD912447', 'A-101', 'Mandan',        'ND', 62,  'online', 268500, 312000, '2021 John Deere 8R 340 row crop tractor with 1,250 original hours. Powershift transmission, 480/80R50 duals front and rear, four remotes, and a 5,000 lb front weight package. AutoTrac ready with a 4640 display and StarFire 6000 receiver included. Full service records, one owner, always shedded.', 'https://www.auctiontime.com/listing/AT-8841203', true,  false, null),
  ('bigiron',     'BI-553102',  '2018 Case IH Magnum 280',    'tractor', 'Case IH',     'Magnum 280',  2018, 280, 2150, 'Used', 'MFWD',  'ZFRF04821',        'B-14',  'Humboldt',      'IA', 14,  'online', 148000, null,   '2018 Case IH Magnum 280 with 2,150 hours, 19-speed powershift, front suspension, and four rear remotes.', 'https://www.bigiron.com/listing/BI-553102', false, false, null),
  ('purplewave',  'PW-77410',   '2020 New Holland T7.270',    'tractor', 'New Holland', 'T7.270',      2020, 270, 1460, 'Used', 'MFWD',  'NH7270JX119',      'C-3',   'Polk City',     'FL', 98,  'online', 132750, null,   '2020 New Holland T7.270 with Auto Command CVT, cab suspension, and 1,460 hours.', 'https://www.purplewave.com/listing/PW-77410', false, false, null),
  ('ritchie',     'RB-2204518', '2019 Challenger MT 775E',    'tractor', 'Challenger',  'MT 775E',     2019, 371, 2300, 'Used', 'Track', 'AGCM775EKR042',    'D-77',  'Moore',         'OK', 223, 'live',   189000, null,   '2019 Challenger MT 775E rubber track tractor, 371 HP, 2,300 hours, 25 inch tracks at roughly 70 percent.', 'https://www.rbauction.com/listing/RB-2204518', false, true,  1),
  ('auctiontime', 'AT-8839911', '2017 John Deere 8320R',      'tractor', 'John Deere',  '8320R',       2017, 320, 3180, 'Used', 'MFWD',  '1RW8320RHHD089221','A-118', 'Grand Island',  'NE', 154, 'online', 172400, null,   '2017 John Deere 8320R with IVT transmission, 3,180 hours, and 620/70R42 rear duals.', 'https://www.auctiontime.com/listing/AT-8839911', false, false, null),
  ('bigiron',     'BI-553188',  '2016 John Deere 6155R',      'tractor', 'John Deere',  '6155R',       2016, 155, 4120, 'Used', 'MFWD',  '1L06155RCGH820114','B-42',  'Sioux Falls',   'SD', 40,  'online', 88500,  102000, '2016 John Deere 6155R utility tractor, 155 HP, AutoQuad Plus transmission, H360 loader included.', 'https://www.bigiron.com/listing/BI-553188', false, false, null),
  ('purplewave',  'PW-77455',   '2015 Kubota M7-171',         'tractor', 'Kubota',      'M7-171',      2015, 168, 3890, 'Used', 'MFWD',  'KBM7171DF5512',    'C-19',  'Wichita',       'KS', 76,  'online', 62000,  null,   '2015 Kubota M7-171 Deluxe with powershift, 3,890 hours, and LA2255 loader.', 'https://www.purplewave.com/listing/PW-77455', false, false, null),
  ('ritchie',     'RB-2204602', '2020 Fendt 724 Vario',       'tractor', 'Fendt',       '724 Vario',   2020, 240, 1780, 'Used', 'MFWD',  'FDT724V20A3391',   'D-91',  'Fort Worth',    'TX', 187, 'live',   215000, null,   '2020 Fendt 724 Vario Gen6 with VarioGrip tyre inflation, front linkage and PTO, 1,780 hours.', 'https://www.rbauction.com/listing/RB-2204602', true,  false, null),
  ('auctiontime', 'AT-8841540', '2014 Case IH Steiger 450',   'tractor', 'Case IH',     'Steiger 450', 2014, 450, 5240, 'Used', '4WD',   'ZEF209844',        'A-204', 'Williston',     'ND', 130, 'online', 158000, null,   '2014 Case IH Steiger 450 HD, 4WD articulated, 5,240 hours, PTO equipped, 800/70R38 duals.', 'https://www.auctiontime.com/listing/AT-8841540', false, false, null),
  ('bigiron',     'BI-553240',  '2019 Massey Ferguson 8737',  'tractor', 'Massey Ferguson', '8737',    2019, 370, 2010, 'Used', 'MFWD',  'MF8737S19K7712',   'B-58',  'Springfield',   'MO', 55,  'online', 176500, null,   '2019 Massey Ferguson 8737S with Dyna-VT transmission and 2,010 hours.', 'https://www.bigiron.com/listing/BI-553240', false, false, null),
  ('purplewave',  'PW-77501',   '2013 John Deere 9460R',      'tractor', 'John Deere',  '9460R',       2013, 460, 6400, 'Used', '4WD',   '1RW9460RTDP003912','C-27',  'Salina',        'KS', 21,  'online', 142000, null,   '2013 John Deere 9460R 4WD, 6,400 hours, 18-speed powershift, 710/70R42 duals.', 'https://www.purplewave.com/listing/PW-77501', false, false, null),
  ('ritchie',     'RB-2204711', '2021 Kubota M6-141',         'tractor', 'Kubota',      'M6-141',      2021, 141, 980,  'Used', 'MFWD',  'KBM6141DH1204',    'D-12',  'Sacramento',    'CA', 205, 'live',   74500,  86000,  '2021 Kubota M6-141 with cab, 980 hours, LA1854 loader and grapple.', 'https://www.rbauction.com/listing/RB-2204711', false, false, null),
  ('auctiontime', 'AT-8841788', '2018 New Holland T8.380',    'tractor', 'New Holland', 'T8.380',      2018, 380, 2870, 'Used', 'MFWD',  'NHT8380ZJL2214',   'A-233', 'Lubbock',       'TX', 118, 'online', 168000, null,   '2018 New Holland T8.380 with Ultra Command transmission, 2,870 hours, IntelliView IV display.', 'https://www.auctiontime.com/listing/AT-8841788', false, false, null),
  ('bigiron',     'BI-553301',  '2012 John Deere 7230R',      'tractor', 'John Deere',  '7230R',       2012, 230, 7150, 'Used', 'MFWD',  '1RW7230RCCD004417','B-73',  'Lincoln',       'NE', 33,  'online', 79000,  null,   '2012 John Deere 7230R, 7,150 hours, IVT, 480/80R46 rears. Runs and operates well.', 'https://www.bigiron.com/listing/BI-553301', false, false, null),
  ('purplewave',  'PW-77560',   '2017 Case IH Maxxum 145',    'tractor', 'Case IH',     'Maxxum 145',  2017, 145, 3320, 'Used', 'MFWD',  'ZGBM14507',        'C-44',  'Des Moines',    'IA', 88,  'online', 68500,  null,   '2017 Case IH Maxxum 145 Multicontroller with L755 loader and 3,320 hours.', 'https://www.purplewave.com/listing/PW-77560', false, false, null),
  ('ritchie',     'RB-2204890', '2016 Fendt 936 Vario',       'tractor', 'Fendt',       '936 Vario',   2016, 360, 4600, 'Used', 'MFWD',  'FDT936V16B8820',   'D-140', 'Denver',        'CO', 241, 'live',   162000, null,   '2016 Fendt 936 Vario S4, 4,600 hours, front linkage, air brakes, guidance ready.', 'https://www.rbauction.com/listing/RB-2204890', false, true,  2),
  ('auctiontime', 'AT-8842010', '2022 John Deere 6R 145',     'tractor', 'John Deere',  '6R 145',      2022, 145, 620,  'Used', 'MFWD',  '1L06R145ANH912004','A-260', 'Fargo',         'ND', 143, 'online', 148500, 165000, '2022 John Deere 6R 145 with only 620 hours, CommandPRO, 640R loader, factory warranty remaining.', 'https://www.auctiontime.com/listing/AT-8842010', true,  false, null),
  ('bigiron',     'BI-553377',  '2011 Case IH Magnum 235',    'tractor', 'Case IH',     'Magnum 235',  2011, 235, 8100, 'Used', 'MFWD',  'ZBRD03104',        'B-88',  'Topeka',        'KS', 27,  'online', 61000,  null,   '2011 Case IH Magnum 235, 8,100 hours, 19-speed powershift, four remotes.', 'https://www.bigiron.com/listing/BI-553377', false, false, null),
  ('purplewave',  'PW-77612',   '2019 Kubota M5-111',         'tractor', 'Kubota',      'M5-111',      2019, 106, 1740, 'Used', 'MFWD',  'KBM5111DJ9930',    'C-61',  'Springfield',   'IL', 65,  'online', 48750,  57000,  '2019 Kubota M5-111 with cab, 1,740 hours, LA1854 loader, excellent rubber.', 'https://www.purplewave.com/listing/PW-77612', false, false, null),
  ('ritchie',     'RB-2205044', '2015 John Deere 8370R',      'tractor', 'John Deere',  '8370R',       2015, 370, 5100, 'Used', 'MFWD',  '1RW8370RLFD067712','D-166', 'Phoenix',       'AZ', 259, 'live',   158500, null,   '2015 John Deere 8370R, 5,100 hours, IVT, ILS front suspension, 480/80R50 duals.', 'https://www.rbauction.com/listing/RB-2205044', false, false, null),
  ('auctiontime', 'AT-8842233', '2020 Massey Ferguson 7726',  'tractor', 'Massey Ferguson', '7726',    2020, 260, 1520, 'Used', 'MFWD',  'MF7726S20L4408',   'A-288', 'Bismarck',      'ND', 172, 'online', 156000, null,   '2020 Massey Ferguson 7726S Dyna-6 with 1,520 hours and front suspension.', 'https://www.auctiontime.com/listing/AT-8842233', false, false, null),
  ('bigiron',     'BI-553444',  '2014 New Holland T7.260',    'tractor', 'New Holland', 'T7.260',      2014, 260, 5600, 'Used', 'MFWD',  'NHT7260ZEK1108',   'B-104', 'Rapid City',    'SD', 47,  'online', 84000,  null,   '2014 New Holland T7.260 Auto Command, 5,600 hours, 50 kph transmission.', 'https://www.bigiron.com/listing/BI-553444', false, false, null),
  ('purplewave',  'PW-77688',   '2010 John Deere 8320',       'tractor', 'John Deere',  '8320',        2010, 320, 9200, 'Used', 'MFWD',  '1RW8320PAAD004180','C-79',  'Kansas City',   'MO', 110, 'online', 68000,  null,   '2010 John Deere 8320 with 9,200 hours, powershift, and 480/80R46 duals. Field ready.', 'https://www.purplewave.com/listing/PW-77688', false, false, null),
  ('ritchie',     'RB-2205190', '2018 Case IH Steiger 540',   'tractor', 'Case IH',     'Steiger 540', 2018, 540, 3400, 'Used', 'Track', 'ZGF412008',        'D-190', 'Billings',      'MT', 277, 'live',   298000, null,   '2018 Case IH Steiger 540 Quadtrac, 3,400 hours, PTO, high capacity hydraulics.', 'https://www.rbauction.com/listing/RB-2205190', true,  false, null),
  ('auctiontime', 'AT-8842401', '2013 Fendt 828 Vario',       'tractor', 'Fendt',       '828 Vario',   2013, 280, 6900, 'Used', 'MFWD',  'FDT828V13C4471',   'A-311', 'Sioux City',    'IA', 196, 'online', 118000, null,   '2013 Fendt 828 Vario SCR, 6,900 hours, front PTO, Vario CVT.', 'https://www.auctiontime.com/listing/AT-8842401', false, false, null),
  ('bigiron',     'BI-553512',  '2021 Kubota M8-201',         'tractor', 'Kubota',      'M8-201',      2021, 197, 1080, 'Used', 'MFWD',  'KBM8201DL2277',    'B-121', 'Omaha',         'NE', 18,  'online', 112500, 128000, '2021 Kubota M8-201 with 1,080 hours, powershift, and factory guidance prep.', 'https://www.bigiron.com/listing/BI-553512', false, false, null),
  ('purplewave',  'PW-77740',   '2016 Challenger MT 865C',    'tractor', 'Challenger',  'MT 865C',     2016, 570, 4750, 'Used', 'Track', 'AGCM865CGP0921',   'C-96',  'Amarillo',      'TX', 103, 'online', 224000, null,   '2016 Challenger MT 865C track tractor, 570 HP, 4,750 hours, 30 inch tracks.', 'https://www.purplewave.com/listing/PW-77740', false, false, null),
  ('ritchie',     'RB-2205322', '2019 John Deere 6120M',      'tractor', 'John Deere',  '6120M',       2019, 120, 2240, 'Used', 'MFWD',  '1L06120MKKH901882','D-214', 'Portland',      'OR', 295, 'live',   79500,  null,   '2019 John Deere 6120M with cab, 2,240 hours, 620R loader, PowrQuad Plus.', 'https://www.rbauction.com/listing/RB-2205322', false, false, null),
  ('auctiontime', 'AT-8842588', '2017 New Holland T6.180',    'tractor', 'New Holland', 'T6.180',      2017, 175, 2960, 'Used', 'MFWD',  'NHT6180ZHM3302',   'A-340', 'Boise',         'ID', 81,  'online', 72000,  null,   '2017 New Holland T6.180 Dynamic Command with 2,960 hours and 740TL loader.', 'https://www.auctiontime.com/listing/AT-8842588', false, false, null),
  ('bigiron',     'BI-553601',  '2012 Massey Ferguson 8660',  'tractor', 'Massey Ferguson', '8660',    2012, 290, 7480, 'Used', 'MFWD',  'MF8660S12H2215',   'B-137', 'Fort Dodge',    'IA', 9,   'online', 74000,  null,   '2012 Massey Ferguson 8660 Dyna-VT, 7,480 hours, front suspension, four remotes.', 'https://www.bigiron.com/listing/BI-553601', false, false, null)
) as v(
  source_key, external_id, title, equipment_category, make, model, year,
  horsepower, hours, condition, drive_type, serial_number, lot_number,
  location_city, location_state, ends_in_hours, auction_type,
  current_bid, buy_it_now_price, description, original_url,
  is_featured, is_sponsored, sponsored_rank
)
join auction_sources s on s.id = case v.source_key
  when 'auctiontime' then '11111111-1111-1111-1111-111111111111'::uuid
  when 'bigiron'     then '22222222-2222-2222-2222-222222222222'::uuid
  when 'purplewave'  then '33333333-3333-3333-3333-333333333333'::uuid
  when 'ritchie'     then '44444444-4444-4444-4444-444444444444'::uuid
end
on conflict (source_id, external_id) do update set
  title = excluded.title,
  make = excluded.make,
  model = excluded.model,
  year = excluded.year,
  horsepower = excluded.horsepower,
  hours = excluded.hours,
  auction_end_date = excluded.auction_end_date,
  current_bid = excluded.current_bid,
  buy_it_now_price = excluded.buy_it_now_price,
  description = excluded.description,
  is_featured = excluded.is_featured,
  is_sponsored = excluded.is_sponsored,
  sponsored_rank = excluded.sponsored_rank,
  updated_at = now();
