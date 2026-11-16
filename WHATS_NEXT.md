# TractorAuction.com — What's Next

Checked against the live site (www.tractorauction.com, logged in as admin) on **2026-11-16**.
Replaces the status sections of `NEXT_STEPS.md`, which was last updated 2026-09-11 and is stale.

---

## 1. Live status snapshot

| Area | What the live site shows | Verdict |
|---|---|---|
| Site | Up, HTTPS, apex redirects to `www` | ✅ |
| Listings | **11 active** (78 total, all statuses) | 🟡 thin |
| Sources | **1 live source: GSA Auctions**. Homepage says "1 Source" | 🔴 SOW needs real data from ≥3 |
| GSA sync | Last run Nov 16, 8:13 AM CST, marked **partial** with a **"404: Not Found"** error | 🔴 investigate |
| Other sources | AuctionTime, BigIron, Purple Wave, Ritchie Bros: pending, never synced. Partner Feed (CSV): active, 0 listings | ⏳ waiting on outreach |
| Recent results | Real GSA closing prices on the homepage (Nov 10–13) | ✅ historical data works |
| Outreach | **All 11 Tier 1 emailed Nov 14**, follow-ups due **Nov 21**. 0 replies so far. 60 companies have no contact email | 🟡 |
| Clicks | 154 outbound all time, 103 from GSA in the last 30 days | ✅ tracking works |
| Users | 252 registered, 72 in the last 7 days. **Almost all are bots** (see §2) | 🔴 |
| Partners | 225 "awaiting review". **Almost all are bots** (see §2) | 🔴 |

---

## 2. P0: Bot signups (fix first)

**What's happening:** since about Oct 12, bots have been submitting `/partner/register` and `/register`
every day. The names are random letters ("Zqfczmsl LLC", "kWTzsTIJkyEa…"). The email
addresses are **real people's addresses** (gmail dot-variants, corporate and university addresses).
This looks like an email-bombing or list-validation attack that uses our forms as the sender.

**Why it matters:**
- Supabase sends a confirmation email to every one of those real people. That's mail they never asked
  for, sent from our domain. It damages the domain's sender reputation, and **the outreach emails go
  out from that same domain**. Spam complaints now could send replies from Ritchie Bros, BigIron and
  the rest straight to junk.
- The admin numbers Troy sees (users, partners) are meaningless right now.
- **Two junk partner applications have already created auction sources:** "Jnmcgal LLC"
  (approved Oct 15) and "Fgxyd LLC". Both show on `/admin/sources`.

**Fix:**
1. [ ] Add bot protection to `signUp` (`src/app/(auth)/actions.ts`) and `submitPartnerApplication`
       (`src/app/partner/actions.ts`). Reuse the honeypot and minimum-time traps already in the contact form
       (`src/app/(marketing)/contact/actions.ts`), and add a real challenge: Vercel BotID or
       Cloudflare Turnstile.
2. [ ] Rate-limit signups per IP. Also check the Supabase Auth rate limits (Dashboard → Auth → Rate Limits).
3. [ ] Check the Supabase Auth logs and Resend dashboard for bounce and complaint rates. If they're high,
       switch to a separate sending subdomain for outreach.
4. [ ] Clean up, **after Troy confirms**: delete the bot partner applications, bot user accounts and
       the 2 junk auction sources. Keep the real ones: Troy's own account (Oct 15) and the "Test" partner
       application if he wants it. Deleting is permanent, so export a CSV first.
5. [ ] Tell Troy. He's been seeing "252 users / 225 partners" and may think that's real traction.

---

## 3. P0: Data sources (acceptance criterion #5)

The SOW requires live data from **at least 3 authorized sources**. Today there is 1.

1. [ ] **Fix the GSA 404.** The sync is "partial", so one of its endpoints is returning 404. Find which one
       in the per-run error log and fix it. GSA is the only live data, so it can't break.
2. [ ] **Outreach follow-up on Nov 21** for all 11 Tier 1 companies (the CRM marks them due).
3. [ ] Check the partnerships inbox daily for replies. Update each company's status in the CRM when they reply.
4. [ ] Start Tier 2 (13 farm auction companies). Find each contact email on the company's own contact page,
       then batch-send. These smaller companies are more likely to say yes quickly than Tier 1.
5. [ ] Look for other **public, authorized** feeds that need no permission, the same way GSA does
       (for example other government surplus programs with published APIs or RSS). Only use feeds whose
       terms allow it; no scraping.
6. [ ] Clean up the CRM duplicates: "Purple Wave" appears twice (Tier 1 and "No tier"), and so does
       "Schrader Real Estate & Auction". 28 companies have no tier.
7. [ ] If ≥3 sources aren't possible before the deadline, agree with Troy **in writing** what
       criterion #5 means at handover (for example: pipeline built, 1 live source, 2+ in negotiation).

---

## 4. P1: Finish QA (open items in `V1_TASKS.md`)

- [ ] #12: create an account end to end on production (after the bot fix, so we test the real flow)
- [ ] #12: password reset email arrives and the link works
- [ ] #12: trigger an alert manually and confirm the email arrives
- [ ] #13: compare tool on mobile
- [ ] #4: audit all current outbound links by hand (only 11 right now, so it's quick)
- [ ] #7: confirm images flow through on a live sync. GSA photos return 401 (we asked GSA for access on Nov 14),
       so stock photos stay for now
- [ ] #20: Troy's Terms and Privacy text went in on Oct 11 (commit "owner's Terms and Conditions…").
       Confirm with Troy and tick it off

---

## 5. P2: Deliverables for Troy

- [ ] **Final QA report** (#23). One table, every feature marked WORKING / PARTIALLY WORKING /
      BROKEN / NOT YET IMPLEMENTED
- [ ] **Partner Center**: a short note on which functions are live today (#15)
- [ ] Update `NEXT_STEPS.md`, or replace it with this file, and fix the stack versions in `CLAUDE.md`
      (it says Next 15; the project uses Next 16)
- [ ] Handover docs: hosting, admin, data sources, outreach, email, analytics, backups
- [ ] Credentials handover and the live walkthrough session

---

## 6. Housekeeping

- [ ] `Untitled` at the repo root is **committed to git** and contains only a 64-character hex string.
      If it's a secret (cron secret, API key), delete the file, rotate the key, and treat it as leaked
      because it's in the git history.

---

## Suggested order this week

| When | Do |
|---|---|
| Today | Bot protection on both forms (§2.1–2.2), check sender reputation (§2.3), fix GSA 404 (§3.1) |
| Tomorrow | Bot cleanup after Troy confirms (§2.4), tell Troy, find Tier 2 emails (§3.4) |
| Nov 18–20 | Send Tier 2, QA items (§4), start the QA report |
| Nov 21 | Tier 1 follow-ups |
| After | Troy deliverables (§5) |
