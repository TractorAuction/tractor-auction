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

Vercel Cron hits `/api/cron/ingest` every 6 hours (`vercel.json`). The schedule
per source lives in the database — the tick asks which sources are due by
`sync_interval_minutes` against `last_synced_at` — so changing a cadence or adding
a source needs no redeploy. Each run carries a wall-clock budget, stops paging
when it expires, records itself as `partial`, and resumes on the next tick.

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
