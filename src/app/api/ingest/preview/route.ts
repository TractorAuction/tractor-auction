import { NextResponse } from "next/server"

import { requireIngestSecret } from "@/lib/ingestion/authorize"
import { runSource } from "@/lib/ingestion/run"
import type { FeedConfig } from "@/lib/ingestion/types"
import type { AuctionSource } from "@/types"

/**
 * Checks a feed mapping against the real payload without writing anything.
 *
 * This is the step between "a partner sent us a feed URL" and "the source is
 * enabled": a wrong fieldMap does not error, it writes plausible rubbish, so the
 * mapping gets eyeballed against a real sample first.
 *
 *   curl -X POST "$SITE/api/ingest/preview" \
 *     -H "authorization: Bearer $CRON_SECRET" \
 *     -H "content-type: application/json" \
 *     -d '{"integration_type":"csv","feed_config":{"url":"https://...","fieldMap":{...}}}'
 */
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: Request) {
  const auth = requireIngestSecret(request)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
  }

  let body: {
    integration_type?: AuctionSource["integration_type"]
    feed_config?: FeedConfig
    website_url?: string
    source_id?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: "Body must be JSON" }, { status: 400 })
  }

  if (!body.integration_type) {
    return NextResponse.json(
      { data: null, error: "integration_type is required" },
      { status: 400 }
    )
  }
  if (!body.feed_config?.url) {
    return NextResponse.json(
      { data: null, error: "feed_config.url is required" },
      { status: 400 }
    )
  }

  // A stand-in source: nothing is written, so only the fields the connector and
  // normalizer read need to be real.
  const source = {
    id: body.source_id ?? "00000000-0000-0000-0000-000000000000",
    name: "preview",
    website_url: body.website_url ?? body.feed_config.url,
    integration_type: body.integration_type,
    status: "active",
    is_featured: false,
    is_sponsored: false,
    created_at: new Date().toISOString(),
  } as AuctionSource

  try {
    const summary = await runSource(source, {
      trigger: "manual",
      dryRun: true,
      budgetMs: 45_000,
      configOverride: body.feed_config,
    })

    return NextResponse.json({ data: summary, error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
