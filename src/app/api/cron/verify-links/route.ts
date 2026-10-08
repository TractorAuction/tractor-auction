import { NextResponse } from "next/server"

import { requireIngestSecret } from "@/lib/ingestion/authorize"
import { expireEndedListings } from "@/lib/ingestion/expire"
import { verifyOutboundLinks } from "@/lib/listings/verify-links"

/**
 * Outbound link health check: pings every active listing's auction page and
 * expires the ones that now 404. Runs the end-date expiry sweep first so it
 * does not spend requests on auctions that have already closed.
 *
 * Driven by the same schedulers as ingestion (vercel.json daily backstop +
 * GitHub Actions every 6h), authenticated the same way.
 */
export const dynamic = "force-dynamic"
export const maxDuration = 60

async function run(request: Request) {
  const auth = requireIngestSecret(request)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
  }

  try {
    const expired = await expireEndedListings()
    const links = await verifyOutboundLinks({ budgetMs: 45_000 })
    return NextResponse.json({ data: { expired, links }, error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export const GET = run
export const POST = run
