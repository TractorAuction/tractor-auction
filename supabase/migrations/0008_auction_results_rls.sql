-- QA finding: auction_results has never had row level security enabled, in
-- any prior migration. Supabase's default grants mean a table without RLS is
-- readable AND writable by the anon/authenticated roles via PostgREST — so
-- right now, the public anon key could insert, update, or delete historical
-- sale prices directly, not just read them. Not theoretical: this table is
-- actively read by the public /results page and written by the archive job
-- in src/lib/listings/archive-results.ts (via the service-role client, which
-- bypasses RLS regardless of policy, so this fix does not affect it).
--
-- Same public-read-only shape as listings and auction_sources (0001/0002):
-- readable by anyone, writable only by the service role.

alter table auction_results enable row level security;

drop policy if exists "auction_results are publicly readable" on auction_results;
create policy "auction_results are publicly readable"
  on auction_results for select
  using (true);
