import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_IDS = 20

/**
 * Records that promoted slots were rendered.
 *
 * Counting happens through a security-definer function so a visitor can
 * increment the counter without being able to update sponsored_placements.
 */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as {
    placementIds?: unknown
  } | null

  const ids = Array.isArray(payload?.placementIds)
    ? payload.placementIds.filter((id): id is string => typeof id === "string" && UUID.test(id))
    : []

  if (ids.length === 0) {
    return NextResponse.json({ data: { counted: 0 }, error: null })
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("increment_placement_impressions", {
    placement_ids: ids.slice(0, MAX_IDS),
  })

  if (error) {
    console.error("[api/impressions]", error.message)
    // Never fail the page over analytics.
    return NextResponse.json({ data: { counted: 0 }, error: null })
  }

  return NextResponse.json({ data: { counted: ids.length }, error: null })
}
