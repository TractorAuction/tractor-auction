import { NextResponse } from "next/server"

import { requireIngestSecret } from "@/lib/ingestion/authorize"
import { expireEndedListings } from "@/lib/ingestion/expire"
import { runDueSources } from "@/lib/ingestion/run"
import { archiveEndedListings } from "@/lib/listings/archive-results"

/**
 * Production ingestion entry point, driven by Vercel Cron (see vercel.json).
 *
 * The scheduler lives in the database rather than in the cron expression: this
 * tick asks which sources are due and runs those, so changing a source's cadence
 * or adding a source is a row edit, not a redeploy.
 *
 * The ingestion core is plain Supabase + fetch with no Next.js coupling, so if
 * run volume outgrows a serverless function it lifts onto a Railway worker by
 * calling runDueSources() from a plain Node entry point instead.
 */

// Cron ticks must never be served from a cache.
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * 60s is the Hobby plan's function ceiling, and a maxDuration above it fails the
 * build rather than degrading. Safe to raise to 300 on Pro. A run that does not
 * finish inside the budget records itself partial and resumes on the next tick,
 * so the cap costs latency rather than correctness.
 */
export const maxDuration = 60

/** Leaves headroom inside maxDuration to write results and respond. */
const RUN_BUDGET_MS = 45_000

async function ingest(request: Request) {
  const auth = requireIngestSecret(request)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
  }

  // ?dry=1 fetches and maps every due feed but writes nothing, which is how a
  // mapping gets checked against live payloads without touching listings.
  const dryRun = new URL(request.url).searchParams.get("dry") === "1"

  try {
    const summaries = await runDueSources({
      trigger: "cron",
      budgetMs: RUN_BUDGET_MS,
      dryRun,
    })
    const expired = dryRun ? 0 : await expireEndedListings()
    // Archiving reads whatever is expired/sold right now, so it runs after the
    // sweep above — a listing that just expired this tick is archived the
    // same tick rather than waiting for the next one.
    const archived = dryRun ? 0 : (await archiveEndedListings()).archived

    return NextResponse.json({
      data: {
        dryRun,
        sourcesRun: summaries.length,
        expired,
        archived,
        totals: summaries.reduce(
          (accumulator, summary) => ({
            seen: accumulator.seen + summary.itemsSeen,
            created: accumulator.created + summary.itemsCreated,
            updated: accumulator.updated + summary.itemsUpdated,
            skipped: accumulator.skipped + summary.itemsSkipped,
          }),
          { seen: 0, created: 0, updated: 0, skipped: 0 }
        ),
        sources: summaries,
      },
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Vercel Cron issues a GET; POST is here for manual and admin-triggered runs.
export const GET = ingest
export const POST = ingest
