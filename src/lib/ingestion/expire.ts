import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Closes out auctions that have ended.
 *
 * Expiry is driven by auction_end_date, never by "this listing stopped appearing
 * in the feed". A truncated run, a feed outage or a paging change would make
 * absence look like a sold lot and silently empty the site. A date in the past is
 * unambiguous; absence is not.
 */
export async function expireEndedListings({
  sourceId,
  limit = 5000,
}: { sourceId?: string; limit?: number } = {}): Promise<number> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  let query = supabase
    .from("listings")
    .update({ status: "expired", updated_at: now })
    .eq("status", "active")
    .lt("auction_end_date", now)
    .limit(limit)

  if (sourceId) query = query.eq("source_id", sourceId)

  const { data, error } = await query.select("id")

  if (error) throw new Error(`expiry sweep failed: ${error.message}`)

  return data?.length ?? 0
}
