# TractorAuction.com V1 Fix List
## From: Troy (talentlocator) feedback doc
## Status: Work through in order. Do not skip to polish until blockers are done.

---

## PRIORITY 1 — BLOCKERS (Fix before anything else)

### 1. Logo / Header (Done)
- [x] Replace black box logo with transparent background version
- [x] Logo must integrate naturally into the dark header
- [x] Test on mobile and desktop 

### 2. Fake Inventory Claims
- [x] Remove or update "1000+ Active Auctions Updated Daily" on homepage
- [x] Replace with real count from database: `SELECT COUNT(*) FROM listings WHERE status = 'active'`
- [x] Make the count dynamic so it updates automatically

### 3. Fake Historical Data
- [x] Remove any placeholder sale prices that appear as real results
- [x] If historical section exists, either hide it or clearly label as "Demo Data"
- [ ] Real results will populate as auctions expire and move to auction_results table

### 4. Broken Outbound Links / 404s
- [ ] Audit ALL current outbound auction links manually
- [x] Build automated check: cron job that pings each original_url and flags 404s
- [x] Mark flagged listings as status = 'expired' automatically
- [x] Add a last_verified_at field to listings table if not already there

### 5. Active vs Expired Logic
- [x] Verify cron job that checks auction_end_date and moves past listings to status = 'expired'
- [x] Expired listings must NOT appear in active search results
- [x] Move expired listings to auction_results table for historical data
- [x] Add this query to the scheduler:
```sql
UPDATE listings
SET status = 'expired'
WHERE auction_end_date < NOW() AND status = 'active';
```

---

## PRIORITY 2 — CORE FUNCTIONALITY

### 6. Auction Data Sync / Staleness
- [x] Review sync frequency per source connector
- [x] Add "Last Updated" timestamp to every listing card and detail page
- [x] Format: "Updated 2 hours ago" using relative time
- [x] If sync is failing silently, add error logging per source run
- [x] Current bid and bid count must reflect source data on each sync

### 7. Missing Images
- [x] Audit why images are not flowing through from source connectors
- [ ] Fix image import in normalization layer for each active connector
- [ ] Images array in listings table should never be empty if source has photos
- [ ] Show first image on ListingCard, gallery on listing detail page
- [x] If source has no images: show a clean equipment silhouette placeholder, NOT a broken image or "No Photo" text box
- [x] Never show placeholder on featured or sponsored listings, flag for manual image add

### 8. Equipment Classification
- [x] Fix normalization logic to correctly classify tractors vs attachments vs other equipment
- [x] Add equipment_category validation in ingestion worker
- [x] Anything not clearly a tractor should go to its own category, not appear in tractor search
- [x] Test: search "tractors" and verify 100% of results are tractors

### 9. Outreach Agent (Activate now, this is in the SOW)
- [x] Confirm outreach CRM is accessible at /admin/outreach
- [x] Verify 43 companies are loaded in database
- [x] Add ANTHROPIC_API_KEY and RESEND_API_KEY to production env
- [x] Test AI email generation for one company end to end
- [ ] Test send and confirm status updates to "contacted"
- [ ] Send Tier 1 batch (11 companies) this week
- [x] Document for Troy: how to access, how to use, how to track responses

---

## PRIORITY 3 — FEATURE VERIFICATION

### 10. Search and Filter QA
Test every combination and confirm it returns accurate results:
- [x] Make filter
- [x] Model filter
- [x] Year range
- [x] Hours max
- [x] Horsepower range
- [x] Location / state
- [x] Auction source
- [x] Price / current bid range
- [x] Auction ending date
- [x] Category
- [x] Sorting: ending soon, recently added, price asc, price desc
- [x] Pagination: page 2, page 3, last page
- [x] Combined filters: e.g. John Deere + Texas + under 2000 hours

### 11. Location / ZIP Radius Search
- [x] Confirm ZIP code search is functional
- [x] Add radius options: 50, 100, 250, 500 miles, Nationwide
- [x] Use lat/lng on listings table for distance calculation
- [x] If not built yet: add a geocoding step in the ingestion worker to convert location to lat/lng
- [x] Heavy equipment buyers rely on this heavily, make it work well

### 12. Saved Searches / Watchlist / Alerts
Test these as real user workflows, not just page existence:
- [ ] Create account end to end
- [x] Login and logout
- [ ] Password reset email received and works
- [x] Save a listing to watchlist
- [x] Remove a listing from watchlist
- [x] Save a search with filters
- [x] Edit a saved search
- [x] Delete a saved search
- [x] Enable email alert on a saved search
- [ ] Trigger alert manually and confirm email arrives
- [x] Alert email link goes to the correct listing or search

### 13. Compare Feature
- [x] Select 2 listings and trigger compare
- [x] Select 3 and 4 listings
- [x] Compare page shows side by side: make, model, year, hours, horsepower, price, location, auction end date, source
- [ ] Compare works on mobile
- [x] Share compare URL works

### 14. View Auction / Bid Now Links
- [x] Test EVERY current outbound link manually
- [x] Each must go to the correct specific machine, not a category page
- [x] No 404s
- [x] No links to ended auctions presented as active
- [x] Click tracking fires correctly on each outbound click

### 15. Partner Center
Confirm which of these are fully working vs placeholder:
- [x] Auction company can submit an application
- [x] Application captures: company name, contact, website, feed type, feed URL
- [x] Admin receives and can review applications
- [x] Admin can approve, reject, or mark as pending
- [x] Partner can submit manual listings
- [x] Partner analytics: clicks sent to their listings
- [ ] Document clearly for Troy which functions are live today

### 16. Monetization
Confirm which of these are real vs visual placeholder:
- [x] Sponsored listing badge shows on ListingCard
- [x] Sponsored listings appear at top of search results
- [x] Featured listings work
- [x] Featured auction source placement works
- [x] Admin can assign sponsored/featured to any listing
- [x] Admin can assign featured to any source
- [x] Impression counter increments on page load for sponsored placements
- [x] Click counter increments on outbound click for sponsored placements
- [x] All sponsored content is clearly labeled in the UI

### 17. Admin Dashboard
Verify Troy can manage everything without developer help:
- [x] Listings: view, search, filter, manually add, deactivate
- [x] Data sources: add, edit, toggle active/inactive
- [x] Partners: view applications, approve, reject
- [x] Users: view list, basic management
- [x] Sponsored placements: assign, schedule, remove
- [x] Outreach: full CRM access
- [x] Analytics: total listings, active sources, outbound clicks today, new signups
- [x] Feed status: last sync time and errors per source

### 18. Data Deduplication
- [x] Confirm unique constraint on (source_id, external_id) is active
- [x] Test: ingest the same listing twice and verify only one record exists
- [x] If the same tractor appears from two different sources, verify they show as separate listings with correct source attribution

---

## PRIORITY 4 — POLISH AND COMPLETENESS

### 19. SEO Pages
- [x] /brand/[brand] pages have correct title, meta description, h1, and real content
- [x] /brand/[brand]/[model] pages same
- [x] /category/[category] and /location/[state] same
- [x] No empty SEO pages being generated with no listings
- [x] Sitemap.xml includes all real pages
- [x] Canonical URLs are correct on all listing pages
- [x] JSON-LD structured data on listing pages

### 20. Legal Pages
- [x] Add Privacy Policy page at /privacy
- [x] Add Terms of Use page at /terms
- [x] Add links to both in footer
- [x] Add clear language on homepage and listing pages: "TractorAuction.com is a search and aggregation platform. We are not the auctioneer, seller, or bidding platform."
- [ ] Troy will provide the actual Privacy Policy and Terms content

### 21. Mobile Responsiveness QA
Test on each device/size:
- [x] Desktop 1440px
- [x] Laptop 1280px
- [x] Tablet 768px
- [x] iPhone (375px)
- [x] Android (360px)

Test these specifically on mobile:
- [x] Search filters panel opens and works
- [x] Listing cards display correctly
- [x] Compare bar does not break layout
- [x] Menus open and close
- [x] Forms are usable
- [x] Buttons are tappable (min 44px touch target)

### 22. UI Polish Pass
- [x] Header: logo integration, spacing, nav consistency
- [x] ListingCard: better visual hierarchy, image placeholder, auction end time, source badge
- [x] Typography: consistent heading sizes and weights across pages
- [x] Spacing: consistent padding and margins across all pages
- [x] Button consistency: same style, size, and color for same action across all pages
- [x] Empty states: search with no results, empty watchlist, no saved searches (each needs a helpful message)
- [x] Featured and sponsored listing presentation should feel premium
- [x] Overall feel: credible national platform, not a dev build

---

## PRIORITY 5 — FINAL QA REPORT

### 23. Full QA Pass
Go through every page and produce a report in this format:

| Feature | Status | Notes |
|---|---|---|
| Homepage search | WORKING | |
| Filters | WORKING | |
| Listing detail page | WORKING | |
| Outbound click tracking | WORKING | |
| ... | ... | |

Status options: WORKING, BROKEN, PARTIALLY WORKING, NOT YET IMPLEMENTED

Fix everything marked BROKEN or NOT YET IMPLEMENTED that is in the SOW.
Send the completed report to Troy before requesting final acceptance.

---

## QUICK WINS TO DO TODAY

1. Fix logo
2. Remove fake inventory count and fake historical data
3. Add "Last Updated" to listing cards
4. Activate outreach agent with API keys
5. Send Tier 1 outreach batch

---

## NOTES FOR TROY COMMUNICATION

When each section above is complete, send Troy a short update:
"Completed items 1 to 5. Here is what changed. Ready for your review on these sections."

Do not send a single update at the end. Update as you go so Troy feels progress and does not go silent again.
