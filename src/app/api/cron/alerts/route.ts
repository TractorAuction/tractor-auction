import { NextResponse } from "next/server"

import { runSavedSearchAlerts, runWatchlistEndingSoonAlerts } from "@/lib/alerts/run"
import { requireIngestSecret } from "@/lib/ingestion/authorize"

/**
 * Production entry point for both alert jobs, driven by the same two-scheduler
 * setup as ingestion (vercel.json daily backstop + GitHub Actions every 6h) —
 * see the README's Data ingestion > Scheduling section for why both exist.
 */
export const dynamic = "force-dynamic"
export const maxDuration = 60

async function run(request: Request) {
  const auth = requireIngestSecret(request)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
  }

  try {
    const [savedSearch, endingSoon] = await Promise.all([
      runSavedSearchAlerts(),
      runWatchlistEndingSoonAlerts(),
    ])

    return NextResponse.json({ data: { savedSearch, endingSoon }, error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export const GET = run
export const POST = run
