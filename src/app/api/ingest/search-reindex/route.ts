import { NextResponse } from "next/server"

import { requireIngestSecret } from "@/lib/ingestion/authorize"
import { ensureIndexConfigured, reindexAll } from "@/lib/meilisearch/sync"

/**
 * Bootstraps the index (create + apply settings) and does a full rebuild from
 * Postgres. This is the bootstrap path for a brand-new Meilisearch project —
 * the index doesn't exist until this runs once — and the recovery path any
 * time the index is suspected to have drifted: idempotent, safe to rerun,
 * every row fully replaced rather than merged.
 *
 *   curl -X POST https://www.tractorauction.com/api/ingest/search-reindex \
 *     -H "authorization: Bearer $CRON_SECRET"
 */
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: Request) {
  const auth = requireIngestSecret(request)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
  }

  try {
    await ensureIndexConfigured()
    const result = await reindexAll()
    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
