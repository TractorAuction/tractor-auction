# TractorAuction.com — Next Steps

Working document. Last updated: 2026-09-11.

Companion to `CLAUDE.md` (the spec). This file tracks **what is actually built**,
what is blocked, and what to do next — in priority order.

---

## 1. Where the project actually stands

| Plan day | Scope | Status |
|---|---|---|
| Day 1 | Project setup, schema deployed | ✅ Done |
| Day 2 | Layout, homepage, seed data | ✅ Done |
| Day 3 | Auth, accounts, protected routes | ✅ Done |
| Day 4 | Search, filters, sort, pagination | ✅ Done (Postgres, not Meilisearch) |
| Day 5 | Listing pages, click tracking | ✅ Done |
| Day 6 | **Data ingestion workers** | ❌ Not started |
| Day 7 | Meilisearch sync, data QA | ⏸️ See decision D1 |
| Day 8 | Watchlist, saved searches | 🟡 Watchlist works; SaveSearchButton pending |
| Day 9 | Email alerts | 🟡 Preferences UI done; send job pending |
| Day 10 | Comparison tool | ❌ Not started |
| Day 11 | SEO landing pages | ✅ Done |
| Day 12 | Outreach CRM | ✅ Built — ⚠️ emails not sent yet |
| Day 13 | Partner Center | ✅ Built (account linking pending) |
| Day 14 | Historical auction results | ❌ Not started |
| Day 15 | Admin dashboard | ✅ Done (real role-based access) |
| Day 16 | Monetization infrastructure | ✅ Done |
| Day 17 | Analytics + reporting | 🟡 Partial (clicks-by-source in admin) |
| Day 18–19 | QA passes | ❌ Not started |
| Day 20 | Production deployment | ❌ Not started |
| Day 21 | Handover + training | ❌ Not started |

**Acceptance criteria met: 7 of 13.**

---

## 2. Do these first (blocking everything else)

### 2.1 Run the outstanding SQL

Supabase dashboard → SQL Editor, **in this order**:

1. `supabase/migrations/0003_partners_and_roles.sql`
2. `supabase/migrations/0004_auth.sql`
3. `supabase/seed_outreach.sql`

All migrations are idempotent — safe to re-run.

> **Why migrations kept failing:** the database was created by an earlier,
> narrower schema, and `create table if not exists` silently skips a table that
> already exists, leaving it short of columns. `0002` reconciles
> `auction_sources` / `listings` / `click_events`; `0003` reconciles every
> remaining table. If a *new* column is ever added to `CLAUDE.md`, add an
> `alter table ... add column if not exists` line rather than editing `0001`.

### 2.2 Fill in `.env.local`

Currently missing or placeholder:

```bash
SUPABASE_SERVICE_ROLE_KEY=    # Supabase → Settings → API → service_role
ANTHROPIC_API_KEY=            # outreach email generator (Claude Haiku 4.5)
NEXT_PUBLIC_SITE_URL=https://www.tractorauction.com
RESEND_API_KEY=               # only needed when you start sending
OUTREACH_FROM_EMAIL=partnerships@tractorauction.com
```

`ADMIN_PREVIEW` is gone — admin access is now a real role check. Create an
admin account with:

```bash
npm run create-admin                     # demo account, generated password
npm run create-admin -- you@example.com  # your own address
```

**Without `SUPABASE_SERVICE_ROLE_KEY` every admin page throws.** Staff-only
tables (`outreach_contacts`, `partners`) have RLS on with no public policy, so
the service role is the only way to read them.

### 2.3 Verify what has never been runtime-tested

Everything below compiles and builds but has not been exercised against the
live database.

```bash
npm run dev
```

- [ ] `npm run create-admin` → log in at `/login` → header shows Admin + Watchlist
- [ ] `/account/watchlist` while logged out redirects to `/login`, then returns you after login
- [ ] Listing page → Save → appears at `/account/watchlist` → Save again removes it
- [ ] `/admin` while logged in as a non-admin shows "Admin access required"
- [ ] `/admin` — stats populate
- [ ] `/admin/listings` — toggle Sponsored on a listing
- [ ] `/search` — that listing appears in the **promoted strip** and **not** in the organic grid
- [ ] `/admin/sponsored` — create a `homepage` placement → appears on `/` → reload increments impressions
- [ ] `/admin/outreach` — add your own email to a row → Compose → Draft → reads sensibly
- [ ] `/partner/register` — submit → lands in `/admin/partners` → Approve creates an `auction_sources` row
- [ ] `/brand/john-deere`, `/brand/john-deere/8r-340`, `/location/north-dakota`, `/category/tractor`
- [ ] `/sitemap.xml` and `/robots.txt`
- [ ] Listing → "View Auction" → then `select count(*) from click_events;` is ≥ 1

---

## 3. Priority order for remaining work

### P0 — On someone else's clock, start immediately

**A. Send the first outreach batch.**
Acceptance criterion #5 requires *real authorized data from ≥3 sources*, and
the coding rules forbid unauthorized scraping. That means written permission,
and reply time is not under your control. The CRM is built and 46 companies are
seeded; the work is filling in contact addresses and sending.

Sequence: fill emails for the 10 SOW-priority companies → draft → send →
set follow-up dates. Everything else in this file can wait a day. This cannot.

**B. ~~Auth (Day 3)~~ — done.** Login, register, logout, the profile trigger,
route middleware, the account area, and real role-based admin access are all in.
`/register` is the canonical path; `/signup` is gone. No dead links remain.

Small follow-ups left over from it:
- `SaveSearchButton` on the search results page (the saved-searches list, alert
  toggles, and delete all work — only the "save this search" entry point is missing)
- The "Set Alert" and "Compare" buttons on listing detail are still inert

### P1 — Highest technical risk

**C. Ingestion workers (Day 6).** `src/workers/` does not exist. Longest-lead
item in the project: connectors, field normalization, dedupe, scheduling, and
per-run error logging. The `unique(source_id, external_id)` key it dedupes
against is already in place. Gated on P0-A landing.

**D. Watchlist + saved searches (Day 8).** Needs auth. The
`unique(user_id, listing_id)` constraint the toggle upserts against is ready.

**E. Email alerts (Day 9).** Needs D + Resend.

### P2 — Remaining acceptance criteria

**F. Comparison tool (Day 10).** No dependencies.
**G. Historical auction results (Day 14).** Populate `auction_results` from
expired/sold listings; add a "Recent sales" section to brand and model pages.
The homepage's "Recent Auction Results" block is still hardcoded placeholder
data — it is marked with a comment in `src/app/(marketing)/page.tsx`.
**H. Full analytics page (Day 17).** Searches, listing views, popular makes.
Clicks-by-source already exists on the admin dashboard.

### P3 — Finish line

**I.** QA passes (Days 18–19) · **J.** Production deploy (Day 20) ·
**K.** Handover + training (Day 21)

---

## 4. Open decisions

### D1. Drop Meilisearch?

Search currently runs on Postgres `ilike`. Fine at 30 rows; slow in the
thousands.

**Recommendation: use Postgres full-text search (`tsvector` + GIN index)** and
keep Meilisearch as a documented upgrade path. It carries the project past
launch and removes an entire service from deployment, credentials, and the
handover walkthrough.

If Meilisearch stays, `NEXT_PUBLIC_MEILISEARCH_HOST` and
`NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY` are still missing from `.env.local`, and
`src/lib/meilisearch/client.ts` is currently imported by nothing.

### D2. Stack drift in `CLAUDE.md`

`package.json` has **Next 16.3.2** and `@base-ui/react`; `CLAUDE.md` says Next
15 and shadcn/ui. Not a problem, but the handover documentation should match
reality. Update the spec.

### D3. Scope vs. schedule

Roughly 10 plan-days of work remain against 8 unmet acceptance criteria. The
ordering above is deliberate: if something slips, what slips is a P3
nice-to-have rather than a contractual acceptance item.

---

## 5. Known gaps in what is already built

These are deliberate, not oversights — but none should reach production as-is.

| Gap | Where | Resolution |
|---|---|---|
| Outreach contacts have no email addresses. | `supabase/seed_outreach.sql` | Intentional — guessing addresses for real businesses risks misdirected mail and domain reputation. Fill in from each company's contact page. |
| Partner dashboard reads a partner row by `user_id`, but nothing links an application to an account yet. | `src/app/partner/dashboard/page.tsx` | Link on approval, or match by email at first login. |
| "Set Alert" and "Compare" on listing detail are inert. | `src/components/listing/listing-actions.tsx` | Day 9 and Day 10. |
| Homepage "Recent Auction Results" is hardcoded. | `src/app/(marketing)/page.tsx` | Replace in Day 14 (item G). |
| `/api/search` and `/api/listings` are built but unused. | `src/app/api/` | Pages query the data layer directly. Routes exist for future client-side use. |
| Filter facets scan up to 2000 rows to dedupe. | `getFilterFacets()` in `src/lib/listings/queries.ts` | Fine at current scale; becomes search-engine facets under D1. |

---

## 6. Architecture notes worth remembering

- **The URL is the source of truth for search state.** `src/lib/listings/filters.ts`
  parses it; the search page and `/api/search` both use it so they cannot drift.
- **`/api/click` takes only `listingId`.** The destination is read from the
  listing row, so the route is structurally incapable of being an open redirect.
- **Paid and organic placement never mix.** `getPromotedListings()` returns
  promoted rows separately and the search page excludes them from the organic
  grid. Every promoted card carries a visible "Sponsored" label.
- **Impressions and placement clicks go through `security definer` functions,**
  so an anonymous visitor can increment a counter without holding `update` on
  `sponsored_placements`.
- **Every admin server action re-checks admin access.** A server action is a
  public endpoint; guarding only the page that renders the form is not enough.
