# TractorAuction.com — Master Development Guide

## Project Summary

TractorAuction.com is a search and discovery platform for tractor and agricultural equipment auctions.
Aggregates listings from multiple auction sources. Users search, filter, and are sent outbound to bid on the original platform.
No bidding happens on this site. Think: Google for tractor auctions.

**Client:** TalentLocator (Fiverr)



**Developer:** Rony
**Deadline:** 3 weeks from order start
**Payment:** $400 at completion + $100 three-week bonus = $500 total
**Bug Fix Period:** 21 days post-acceptance

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Lucide React |
| Database | Supabase (PostgreSQL) |
| Search | Meilisearch |
| Auth | Supabase Auth |
| Email | Resend |
| AI (Outreach) | Anthropic Claude API (Haiku 4.5) |
| Ingestion Workers | Node.js on Railway or Fly.io |
| Analytics | Plausible or Vercel Analytics |
| Deployment | Vercel (frontend) + Supabase (DB) + Railway (workers) |

---

## Design Direction

- Dark charcoal / slate / muted green palette
- Modern ag-tech premium marketplace feel
- Clean, data-focused, fast
- NOT similar to John Deere branding
- Mobile first, fully responsive

```ts
// tailwind.config.ts
colors: {
  charcoal: {
    900: '#1a1d1e',  // primary background
    800: '#222527',  // card background
    700: '#2c3033',  // borders
  },
  green: {
    muted:  '#4a6741',
    light:  '#6a9e5f',
    accent: '#7fb573',  // CTA buttons
  }
}
```

---

## Folder Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                        # Homepage
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   ├── (platform)/
│   │   ├── search/page.tsx                 # Search results + filters
│   │   ├── listing/[id]/page.tsx           # Single listing page
│   │   ├── brand/[brand]/page.tsx          # SEO brand pages
│   │   ├── brand/[brand]/[model]/page.tsx  # SEO model pages
│   │   ├── category/[category]/page.tsx    # Category pages
│   │   ├── location/[state]/page.tsx       # Location pages
│   │   ├── compare/page.tsx                # Comparison tool
│   │   └── auction/[source]/page.tsx       # Auction company pages
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── account/
│   │   ├── watchlist/page.tsx
│   │   ├── saved-searches/page.tsx
│   │   └── alerts/page.tsx
│   ├── partner/
│   │   ├── page.tsx                        # Partner landing page
│   │   ├── register/page.tsx               # Partner signup
│   │   └── dashboard/page.tsx              # Partner portal
│   ├── admin/
│   │   ├── page.tsx                        # Dashboard home + stats
│   │   ├── listings/page.tsx
│   │   ├── sources/page.tsx
│   │   ├── outreach/page.tsx               # Outreach agent CRM
│   │   ├── sponsored/page.tsx
│   │   ├── users/page.tsx
│   │   ├── partners/page.tsx
│   │   └── analytics/page.tsx
│   └── api/
│       ├── listings/route.ts
│       ├── search/route.ts
│       ├── click/route.ts                  # Outbound click tracking
│       ├── alerts/route.ts
│       ├── outreach/send/route.ts
│       ├── outreach/preview/route.ts
│       └── partner-submit/route.ts
├── components/
│   ├── ui/                                 # shadcn components
│   ├── listing/
│   │   ├── ListingCard.tsx
│   │   ├── ListingGrid.tsx
│   │   ├── ListingDetail.tsx
│   │   └── CompareBar.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   └── SearchResults.tsx
│   ├── account/
│   │   ├── WatchlistButton.tsx
│   │   └── SaveSearchButton.tsx
│   ├── admin/
│   │   ├── DataTable.tsx
│   │   └── StatsCard.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── AdminNav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── meilisearch/
│   │   ├── client.ts
│   │   └── sync.ts
│   ├── outreach/
│   │   └── generate-email.ts
│   └── utils/
│       ├── cn.ts
│       └── format.ts
├── types/index.ts
└── workers/
    ├── sources/
    │   ├── bigiron.ts
    │   ├── purplewave.ts
    │   └── auctiontime.ts
    └── scheduler.ts
```

---

## Database Schema

```sql
-- Auction sources / data partners
create table auction_sources (
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

-- Listings
create table listings (
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

-- User accounts
create table profiles (
  id uuid primary key references auth.users(id),
  email text,
  full_name text,
  created_at timestamptz default now()
);

-- Watchlists
create table watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

-- Saved searches
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text,
  filters jsonb not null,
  alert_enabled boolean default false,
  last_alerted_at timestamptz,
  created_at timestamptz default now()
);

-- Outreach CRM
create table outreach_contacts (
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

-- Outbound click tracking
create table click_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  source_id uuid references auction_sources(id),
  user_id uuid references profiles(id),
  clicked_at timestamptz default now()
);

-- Sponsored placements
create table sponsored_placements (
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

-- Historical auction results
create table auction_results (
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

-- Indexes
create index on listings(make);
create index on listings(model);
create index on listings(status);
create index on listings(auction_end_date);
create index on listings(source_id);
create index on listings(is_featured);
create index on listings(location_state);
create index on listings(equipment_category);
```

---

## TypeScript Types

```ts
// types/index.ts

export type AuctionSource = {
  id: string
  name: string
  website_url: string
  logo_url?: string
  integration_type: 'api' | 'rss' | 'xml' | 'csv' | 'manual' | 'ftp' | 'email'
  status: 'active' | 'inactive' | 'pending'
  is_featured: boolean
  is_sponsored: boolean
  last_synced_at?: string
  created_at: string
}

export type Listing = {
  id: string
  external_id?: string
  source_id: string
  source?: AuctionSource
  title?: string
  equipment_category: string
  make?: string
  model?: string
  year?: number
  horsepower?: number
  hours?: number
  condition?: string
  drive_type?: string
  serial_number?: string
  lot_number?: string
  location_city?: string
  location_state?: string
  location_lat?: number
  location_lng?: number
  auction_company?: string
  auction_end_date?: string
  auction_type?: string
  current_bid?: number
  buy_it_now_price?: number
  description?: string
  images: string[]
  original_url: string
  is_featured: boolean
  is_sponsored: boolean
  status: 'active' | 'expired' | 'sold'
  sold_price?: number
  sold_date?: string
  created_at: string
  updated_at: string
}

export type OutreachContact = {
  id: string
  company_name: string
  website_url?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  geographic_coverage?: string
  inventory_type?: string
  existing_api_info?: string
  status: 'pending' | 'contacted' | 'follow_up' | 'responded' |
          'api_requested' | 'api_received' | 'integration_pending' |
          'integrated' | 'declined' | 'no_response'
  outreach_date?: string
  follow_up_date?: string
  response_date?: string
  notes?: string
  created_at: string
}

export type SearchFilters = {
  query?: string
  equipment_category?: string
  make?: string
  model?: string
  year_min?: number
  year_max?: number
  horsepower_min?: number
  horsepower_max?: number
  hours_max?: number
  price_min?: number
  price_max?: number
  location_state?: string
  source_id?: string
  ending_before?: string
  sort_by?: 'ending_soon' | 'recently_added' | 'price_asc' | 'price_desc'
}

export type SavedSearch = {
  id: string
  user_id: string
  name: string
  filters: SearchFilters
  alert_enabled: boolean
  created_at: string
}
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Meilisearch
MEILISEARCH_HOST=
MEILISEARCH_API_KEY=
NEXT_PUBLIC_MEILISEARCH_HOST=
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=

# Email
RESEND_API_KEY=
OUTREACH_FROM_EMAIL=partnerships@tractorauction.com
ALERTS_FROM_EMAIL=alerts@tractorauction.com

# AI (Outreach Agent)
ANTHROPIC_API_KEY=
```

---

## 3-Week Development Plan

### WEEK 1 — Foundation + Data (Days 1 to 7)

#### Day 1: Project Setup
- [x] Initialize Next.js 15, TypeScript, Tailwind, shadcn
- [x] Configure theme colors
- [x] Set up Supabase project and run full schema
- [x] Configure environment variables
- [x] Set up folder structure

#### Day 2: Core Layout + Homepage Shell
- [ ] Header with search bar, nav, auth buttons
- [ ] Footer with links
- [ ] Homepage hero section with prominent search
- [ ] Featured listings section (static for now)
- [ ] Recently added section
- [ ] Ending soon section
- [ ] Seed 30 sample listings in Supabase for dev

#### Day 3: Auth + User Accounts
- [ ] Supabase Auth: login, register, logout
- [ ] Profile creation on signup (trigger)
- [ ] Protected route middleware
- [ ] Account layout and nav
- [ ] Watchlist page shell
- [ ] Saved searches page shell

#### Day 4: Search + Filters
- [ ] Set up Meilisearch, create listings index
- [ ] SearchBar component with URL state sync
- [ ] FilterPanel: make, model, year, horsepower, hours, state, source, price, ending date
- [ ] SearchResults page with ListingGrid
- [ ] Sort options: ending soon, recently added, price asc/desc
- [ ] Pagination

#### Day 5: Listing Pages + Click Tracking
- [ ] ListingCard component (image, make, model, year, hours, price, source badge, end date)
- [ ] Single listing detail page with all fields
- [ ] View Auction outbound button
- [ ] /api/click route for tracking before redirect
- [ ] Sponsored/featured badge display
- [ ] Related listings section

#### Day 6: Data Ingestion Workers
- [ ] Worker architecture setup on Railway
- [ ] Connector: BigIron Auctions
- [ ] Connector: AuctionTime
- [ ] Connector: Purple Wave
- [ ] Data normalization layer (map source fields to Listing schema)
- [ ] Deduplication logic (source_id + external_id)
- [ ] Sync scheduler (cron per source)
- [ ] Error logging per sync run

#### Day 7: Meilisearch Sync + Data QA
- [ ] Auto-sync Meilisearch after each ingestion run
- [ ] Test search with real data from 3 sources
- [ ] Handle missing fields gracefully in UI
- [ ] Expired listing cleanup job

---

### WEEK 2 — User Features + SEO + Outreach (Days 8 to 14)

#### Day 8: Watchlist + Saved Searches
- [ ] WatchlistButton on listing cards (toggle save)
- [ ] Watchlist page: view all saved listings
- [ ] SaveSearchButton on search results page
- [ ] Saved searches page: list, name, delete
- [ ] Alert toggle per saved search

#### Day 9: Email Alerts
- [ ] Resend email setup and templates
- [ ] Alert job: check saved searches daily, send matches
- [ ] Ending soon alert: notify users 24h before watched auction ends
- [ ] Unsubscribe link in every alert email
- [ ] Alert management in account page

#### Day 10: Comparison Tool
- [ ] CompareBar: floating bar when 2+ listings selected
- [ ] Compare page: side-by-side attribute table
- [ ] Max 4 listings comparison
- [ ] Share compare URL

#### Day 11: SEO Landing Pages
- [ ] /brand/[brand] pages (John Deere, Kubota, Case IH, New Holland, etc.)
- [ ] /brand/[brand]/[model] pages
- [ ] /category/[category] pages
- [ ] /location/[state] pages
- [ ] Dynamic metadata per page
- [ ] JSON-LD structured data on listing pages
- [ ] Sitemap.xml generation
- [ ] robots.txt
- [ ] Canonical URLs

#### Day 12: Outreach Agent CRM
- [ ] Seed all 40+ companies into outreach_contacts
- [ ] Admin outreach dashboard: table with all fields
- [ ] Status pipeline: pending to integrated
- [ ] AI email generator (Haiku 4.5 via Anthropic API)
- [ ] Preview email before sending
- [ ] Send via Resend with one click
- [ ] Status auto-updates to contacted after send
- [ ] Editable email templates
- [ ] Follow-up date tracking and filter
- [ ] Notes field per company
- [ ] Export to CSV

#### Day 13: Partner Center
- [ ] Public partner landing page explaining the opportunity
- [ ] Partner registration form
- [ ] Partner portal: company profile, feed URL submission, listing status view
- [ ] Admin partner queue: approve, reject, manage
- [ ] Manual listing submission form for partners

#### Day 14: Historical Data + Buffer Day
- [ ] auction_results table populated from expired/sold listings
- [ ] Recent sales section on brand and model pages
- [ ] Buffer: fix any issues from Week 1 and 2

---

### WEEK 3 — Admin + Monetization + Deploy (Days 15 to 21)

#### Day 15: Admin Dashboard
- [ ] Admin login with role-based access (Supabase RLS)
- [ ] Admin layout with sidebar nav
- [ ] Stats overview: total listings, active sources, clicks today, new users
- [ ] Listings management: view, filter, edit, deactivate
- [ ] Auction sources management: add, edit, toggle
- [ ] Users management: view, ban
- [ ] Categories and makes/models management
- [ ] Content management: basic page content editing

#### Day 16: Monetization Infrastructure
- [ ] Sponsored listing badge in ListingCard
- [ ] Featured listing placement at top of search results
- [ ] Featured source in sidebar
- [ ] Homepage promotional placement slots
- [ ] Category sponsor placement
- [ ] Banner ad placeholder slots
- [ ] Admin control: assign sponsored/featured to any listing or source
- [ ] Impression counter per placement
- [ ] Organic vs promoted clearly separated in DB and UI
- [ ] All sponsored content labeled clearly for users

#### Day 17: Analytics + Reporting
- [ ] Plausible or Vercel Analytics installed
- [ ] Outbound click tracking confirmed working
- [ ] Admin analytics page: searches, listing views, clicks, popular makes
- [ ] Partner traffic reporting (clicks per source)
- [ ] Featured listing performance report
- [ ] New user registrations over time

#### Day 18: QA Pass 1
- [ ] Desktop QA on all pages
- [ ] Mobile QA on all pages
- [ ] Test user registration, login, watchlist, saved search, alerts
- [ ] Test search + all filters
- [ ] Test outbound links and click tracking
- [ ] Test data ingestion end to end
- [ ] Test outreach agent send and status update
- [ ] Test partner submission flow
- [ ] Test admin all sections
- [ ] Test featured and sponsored placements
- [ ] Fix all critical bugs found

#### Day 19: QA Pass 2 + Performance
- [ ] Lighthouse score above 85 on all key pages
- [ ] Loading skeletons on search results
- [ ] Error states and empty states on all pages
- [ ] 404 page
- [ ] Test email delivery for alerts and outreach
- [ ] Security: check RLS policies on all tables
- [ ] Confirm no broken links or placeholder buttons

#### Day 20: Production Deployment
- [ ] Deploy frontend to Vercel
- [ ] Configure TractorAuction.com domain
- [ ] SSL confirmed
- [ ] Deploy worker service to Railway
- [ ] Set all production environment variables
- [ ] Configure Resend for production domain
- [ ] Configure Meilisearch in production
- [ ] Test everything on live domain end to end
- [ ] Load real authorized auction data from at least 3 sources

#### Day 21: Handover + Training
- [ ] Hand over source code repo
- [ ] Hand over all account credentials: Vercel, Supabase, Railway, Resend, Meilisearch
- [ ] Write documentation: hosting, admin, data sources, outreach agent, email, analytics, backup
- [ ] Live walkthrough session covering:
  - Admin dashboard navigation
  - Managing listings and sources
  - Outreach agent operation
  - Viewing analytics and click reports
  - Managing sponsored placements
  - Adding new auction sources

---

## Priority Auction Sources

| # | Source | URL | Status |
|---|---|---|---|
| 1 | EquipmentFacts | equipmentfacts.com | Build connector |
| 2 | AuctionTime | auctiontime.com | Build connector |
| 3 | BigIron | bigiron.com | Build connector |
| 4 | Purple Wave | purplewave.com | Build connector |
| 5 | Ritchie Bros | rbauction.com | Outreach first |
| 6 | IronPlanet | ironplanet.com | Outreach first |
| 7 | Proxibid | proxibid.com | Outreach first |
| 8 | HiBid | hibid.com | Outreach first |
| 9 | BidSpotter | bidspotter.com | Outreach first |
| 10 | Steffes Group | steffesgroup.com | Outreach first |

---

## Coding Rules

- Server components by default, client components only when needed
- All DB access via lib/supabase/server.ts in server components
- All types from types/index.ts, never inline
- API routes return `{ data, error }` shape consistently
- Use cn() for all className merging
- Tailwind only, no inline styles
- All images via Next.js Image component
- All outbound links go through /api/click before redirecting
- Sponsored content always clearly labeled in UI
- No unauthorized scraping, no CAPTCHA bypassing, no private APIs

---

## Acceptance Criteria (from SOW)

1. Live on TractorAuction.com domain
2. User-facing functionality operational
3. Admin dashboard operational
4. Search and filtering working
5. Data ingestion operational with real authorized data
6. Saved searches, watchlists, alerts working
7. Partner center operational
8. Outreach agent CRM operational
9. Monetization infrastructure implemented
10. Analytics and click tracking implemented
11. Production QA completed
12. All credentials and source code handed over
13. Documentation and training provided

---

## Current Status

- [x] Deal closed with client ($400 + $100 bonus)
- [x] SOW reviewed and agreed
- [x] Revised SOW received and merged
- [x] Day 1 complete: project initialized, schema deployed, folder structure in place
- [ ] Day 2 in progress