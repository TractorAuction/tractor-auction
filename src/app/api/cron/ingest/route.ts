import { NextResponse } from "next/server"

import { requireIngestSecret } from "@/lib/ingestion/authorize"
import { expireEndedListings } from "@/lib/ingestion/expire"
import { runDueSources } from "@/lib/ingestion/run"

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
 * Ingestion is I/O bound on other companies' feeds. 300s is the ceiling on Pro;
 * Hobby caps lower, which is safe because the run carries its own time budget and
 * records itself as partial, resuming at the next tick.
 */
export const maxDuration = 300

/** Leaves headroom inside maxDuration to write results and respond. */
const RUN_BUDGET_MS = 240_000

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

    return NextResponse.json({
      data: {
        dryRun,
        sourcesRun: summaries.length,
        expired,
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
