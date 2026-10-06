# TractorAuction.com

A search and discovery platform for tractor and agricultural equipment auctions.

Listings are aggregated from multiple auction sources so buyers can search one
place, compare across sellers, and click through to bid on the original auction
site. **No bidding happens here** — TractorAuction.com is a search engine for
auctions, not an auction house, and takes no commission on any sale.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4, Base UI primitives |
| Database & Auth | Supabase (PostgreSQL) |
| Email | Resend |
| AI (outreach drafting) | Anthropic Claude (Haiku 4.5) |
| Icons | Lucide |
| Package manager | pnpm |

---

## Getting started

### 1. Install

```bash
pnpm install
```

### 2. Configure the environment

Create `.env.local` in the project root:

```bash
# Supabase — dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only, never expose to the browser

# Site
NEXT_PUBLIC_SITE_URL=https://www.tractorauction.com   # canonical URLs + sitemap

# Meilisearch — cloud.meilisearch.com → project → Settings → API Keys
MEILISEARCH_HOST=                           # server-side, e.g. https://ms-xxxx.meilisearch.io
MEILISEARCH_API_KEY=                        # Default Admin API Key — full access, server-only
NEXT_PUBLIC_MEILISEARCH_HOST=               # same host, public
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=         # Default Search API Key — search-only, safe to expose

# Outreach CRM
ANTHROPIC_API_KEY=                # AI email drafting
RESEND_API_KEY=                   # sending
OUTREACH_FROM_EMAIL=partnerships@tractorauction.com

# Ingestion — any long random string; `openssl rand -hex 32`
CRON_SECRET=

# Alerts (Day 9)
ALERTS_FROM_EMAIL=alerts@tractorauction.com
```

Missing or placeholder Supabase values fail with an actionable message rather
than a cryptic DNS error — see `src/lib/supabase/env.ts`.

### 3. Set up the database

In the Supabase dashboard → SQL Editor, run **in order**:

```
supabase/migrations/0001_init.sql            schema, indexes, public-read RLS
supabase/migrations/0002_align_schema.sql    reconciles pre-existing tables
supabase/migrations/0003_partners_and_roles.sql
supabase/migrations/0004_auth.sql            profile trigger, admin check, per-user RLS
supabase/migrations/0005_outreach_tiers.sql
supabase/migrations/0006_ingestion.sql       feed config per source + sync_runs audit log
```

Then seed:

```
supabase/seed.sql            4 auction sources + 30 sample listings
supabase/seed_outreach.sql   43 outreach prospects across 7 tiers
supabase/seed_sources.sql    feed config + field maps for the priority sources
```

> **Migration rule:** never edit `0001`. It uses `create table if not exists`,
> which silently skips a table that already exists and leaves it short of
> columns. To add a column, write a new migration with
> `alter table ... add column if not exists`. All migrations are idempotent and
> safe to re-run.

### 4. Create an admin account

```bash
pnpm create-admin                     # demo account, generated password
pnpm create-admin you@example.com     # your own address
```

Creates the user with its email pre-confirmed and sets `profiles.role = 'admin'`.
Admin access is a real role check — there is no bypass flag.

### 5. Run it

```bash
pnpm dev
```

http://localhost:3000

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` | Production build (runs typecheck) |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm create-admin` | Create or promote an admin account |

---

## Project layout

```
src/
├── app/
│   ├── (marketing)/          Homepage, about, resources, alerts landing
│   ├── (platform)/           Search, listings, brands, results, SEO pages
│   ├── (auth)/               Login, register, email confirmation callback
│   ├── account/              Watchlist, saved searches, alert preferences
│   ├── admin/                Dashboard, listings, sources, outreach, partners
│   ├── partner/              Partner Center: landing, application, portal
│   └── api/                  Search, listings, click tracking, outreach, impressions
├── components/               UI grouped by domain
├── lib/
│   ├── supabase/             client (browser) / server (cookies) / admin (service role)
│   ├── listings/             queries, URL filter parsing, promotions
│   ├── outreach/             tier angles, email generation
│   ├── admin/                staff-only queries (service role)
│   ├── auth/                 admin gate
│   └── seo/                  slugs, states, categories
└── types/index.ts            All shared types
supabase/                     Migrations and seeds
```

---

## How it works

**Search state lives in the URL.** `src/lib/listings/filters.ts` is the single
parser, used by both the search page and `/api/search`, so the two cannot drift
apart. Saved searches store the same filter shape and rebuild the URL.

**Outbound clicks are tracked, and cannot be hijacked.**
`/api/click?listingId=<id>` records a `click_events` row, then redirects to the
destination **read from the listing row**. The URL is never taken from a query
parameter, so the route is structurally incapable of being an open redirect.

**Paid and organic placement never mix.** Promoted listings are fetched by a
separate query and excluded from the organic result set, then rendered in their
own labelled strip. Every promoted card carries a visible "Sponsored" label.

**Three Supabase clients, deliberately.** `server.ts` (cookie-backed, acts as
the signed-in user, RLS applies), `admin.ts` (service role, bypasses RLS —
server-only, behind an admin check), and `public.ts` (anon, no cookies, so
cacheable routes like the sitemap don't become dynamic).

**Security-definer functions** back the impression and click counters and the
admin check, so an anonymous visitor can increment a counter without holding
`update` on the table, and a policy on `profiles` doesn't recurse.

**Every admin server action re-checks access.** A server action is a public
endpoint; guarding only the page that renders the form would leave it open.

---

## Data ingestion

Listings are ingested from **authorized** source feeds. The connector is chosen by
wire format, not by company, so onboarding a source is a row in `auction_sources`
rather than a new file:

| `integration_type` | Connector | Use for |
|---|---|---|
| `api` | `json-api` | REST/JSON partner feeds, with optional paging |
| `rss`, `xml` | `xml-feed` | RSS and XML exports |
| `csv`, `ftp`, `google_sheets` | `csv-feed` | CSV exports and published Google Sheets |
| `manual`, `email` | — | Partner portal / admin entry; no automated fetch |

`feed_config` holds the feed URL and a `fieldMap` pointing each `listings` column
at the raw key that carries it, so a partner who calls a column `EquipMake` needs
a config edit, not code. Optional keys: `itemsPath`, `staticFields`,
`pageParam`/`pageSize`/`maxPages`, `authHeaderEnv`, `delimiter`.

### Onboarding a feed

1. **Preview the mapping first.** A wrong `fieldMap` does not error — it writes
   plausible rubbish. The preview fetches and maps the real feed and writes nothing:

   ```bash
   curl -X POST https://www.tractorauction.com/api/ingest/preview \
     -H "authorization: Bearer $CRON_SECRET" \
     -H "content-type: application/json" \
     -d '{"integration_type":"csv","feed_config":{"url":"https://…","fieldMap":{…}}}'
   ```

2. Check the returned `sample` against the live listing pages, then save the
   config onto the source row and set `sync_enabled = true`.

3. Watch the first real run in `sync_runs`.

### Scheduling

Two schedulers drive the same endpoint, because the Vercel **Hobby** plan runs
cron at most once a day and caps functions at 60s:

| Scheduler | Cadence | Notes |
|---|---|---|
| `.github/workflows/ingest.yml` | every 6h | Primary. Needs `CRON_SECRET` and `SITE_URL` repo secrets. Also runnable by hand from the Actions tab. |
| `vercel.json` cron | daily, 07:00 UTC | Backstop. Raise to `0 */6 * * *` on Pro and the workflow becomes optional. |

The endpoint authenticates with a bearer token rather than being tied to Vercel's
scheduler, so any scheduler can drive it and a doubled run is harmless.

The schedule **per source** lives in the database — the tick asks which sources are
due by `sync_interval_minutes` against `last_synced_at` — so changing a cadence or
adding a source needs no redeploy. Each run carries a wall-clock budget, stops
paging when it expires, records itself as `partial`, and resumes on the next tick.

> On Hobby, raising `maxDuration` above 60 in the route fails the build rather
> than degrading at runtime. Same for a sub-daily `vercel.json` cron.

`?dry=1` runs every due feed without writing anything.

The core (`src/lib/ingestion/`) has no Next.js coupling, so if volume outgrows a
serverless function it lifts onto a Railway worker by calling `runDueSources()`
from a plain Node entry point.

### Guarantees

- **Deduplication** is `(source_id, external_id)`, enforced by a unique index and
  upsert. Feeds that repeat a lot across pages are also deduped in-batch, because
  Postgres refuses an upsert that hits the same conflict target twice.
- **Admin promotions survive a sync.** `is_featured`, `is_sponsored` and
  `sponsored_rank` are never written by ingestion.
- **One bad row costs one row.** Items that fail validation are recorded in
  `sync_runs.item_errors` with a reason; the rest of the feed still lands.
- **Expiry is date-driven**, never "this listing stopped appearing in the feed" —
  a truncated run or feed outage would otherwise read as sold stock and empty the
  site.
- **Nothing is disguised.** Requests identify themselves as `TractorAuctionBot`
  with a contact address and back off on 429/5xx. A source that blocks automated
  access is treated as a source that needs a data agreement.

### Source authorization status

As checked 2026-10-01, no third-party feed is authorized yet, so every source
ships `sync_enabled = false`. See the header of `supabase/seed_sources.sql` for
what each one is waiting on. The path that works without a third-party agreement
is **Partner Feed (CSV)**: publish a sheet, point `feed_config.url` at its CSV
export, enable it.

## Search (Meilisearch)

Search and the filter dropdowns run on Meilisearch Cloud, with Postgres as a
fallback — a search index outage degrades search, it doesn't break it.

### How it's split

Meilisearch only ever answers "which ids match, in what order, with what facet
counts." It does **not** hold the full listing — `lib/meilisearch/client.ts`'s
`ListingDocument` is a flat, filterable/sortable/searchable subset. Once
Meilisearch returns ranked ids, Postgres is queried `WHERE id IN (...)` for the
actual rows (joined source, every column), in the order Meilisearch gave. This
keeps Postgres the one place the full `Listing` shape is maintained — a renamed
source or a new column never needs a reindex to show up correctly.

| | Backed by | Fallback |
|---|---|---|
| `searchListingsSafe()` (lib/listings/search-index.ts) | Meilisearch + Postgres hydrate | Postgres `ilike` (`searchListings()`) |
| `getSearchFacets()` | Meilisearch `facetDistribution` | Postgres distinct-scan (`getFilterFacets()`) |

Both wrap their indexed path in try/catch; any failure — index not configured,
Cloud instance unreachable, a malformed filter — logs and falls through to the
Postgres function that worked before Meilisearch existed. Every search-facing
page (`/search`, the homepage, brand/category/location pages) calls the `*Safe`
versions, never the Meilisearch functions directly.

### Keeping the index in sync

Nothing polls. Every write path pushes its own change:

- **Ingestion** (`lib/ingestion/run.ts`) re-fetches the rows it just wrote (with
  id and defaults, not reconstructed from the raw feed) and calls `syncListings()`
  after every run. A sync failure downgrades that run to `partial` and records why
  in `sync_runs.error_message` — it does not fail the run, since the Postgres
  write that mattered already succeeded.
- **Admin actions** (`app/admin/actions.ts`) — toggling featured/sponsored,
  changing a listing's status — call `patchListing(id, {...})` for a one-field
  update, logged on failure, never thrown. The UI doesn't hang on a Meilisearch
  hiccup.

### Bootstrapping and recovery

The index doesn't exist until something creates it. Bearer-gated like the other
`/api/ingest/*` routes:

```bash
curl -X POST https://www.tractorauction.com/api/ingest/search-reindex \
  -H "authorization: Bearer $CRON_SECRET"
```

This creates the index if missing, (re)applies `LISTINGS_INDEX_SETTINGS`, and
does a full rebuild from Postgres. It's idempotent — every document is fully
replaced, nothing merged — so it's also the fix any time the index is suspected
to have drifted from Postgres (a failed sync that wasn't retried, a changed
document shape after a code change).

`/api/ingest/health` reports whether all four `MEILISEARCH_*`/`NEXT_PUBLIC_MEILISEARCH_*`
vars are set and attempts a live connection, without ever printing a secret back.

## Documentation

| File | Contents |
|---|---|
| `CLAUDE.md` | Full specification, schema, and the 21-day plan |
| `NEXT_STEPS.md` | Current status, what's blocked, priority order |
| `OUTREACH_SOURCES.md` | Prospect list, tiers, and outreach messaging rules |

---

## Deployment

Frontend deploys to Vercel; the database is hosted Supabase. Set every variable
from the environment section above in the Vercel project, and point
`NEXT_PUBLIC_SITE_URL` at the production domain so canonical URLs and the
sitemap emit the right host.

`/admin`, `/account`, `/partner/dashboard` and `/api/` are excluded from
`robots.txt`, and the admin area sets `robots: noindex` on top of that.
