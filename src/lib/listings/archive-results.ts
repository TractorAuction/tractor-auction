import { createAdminClient } from "@/lib/supabase/admin"

const BATCH = 500

/**
 * Copies ended listings into auction_results, the permanent price-history
 * table "recent sales" sections read from.
 *
 * Deliberately not restricted to status = 'sold': most feeds report a closing
 * bid, not a confirmed hammer price (no-sale and reserve-not-met are common at
 * ag auctions), so an expired listing's final current_bid is archived as the
 * best publicly available estimate — same fallback the /results page already
 * uses when auction_results is empty. A listing with no price at all is
 * skipped; there is nothing useful to show.
 *
 * Upserts on listing_id, so a listing whose price changes before this next
 * runs (current_bid corrected by a late feed update) stays in sync rather
 * than being silently skipped as "already archived."
 */
export async function archiveEndedListings(): Promise<{ archived: number }> {
  const supabase = createAdminClient()
  let archived = 0
  let from = 0

  for (;;) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, source_id, make, model, year, horsepower, hours, current_bid, sold_price, sold_date, auction_company, location_state, original_url, updated_at")
      .in("status", ["expired", "sold"])
      .range(from, from + BATCH - 1)

    if (error) throw new Error(`archiveEndedListings: failed to read listings: ${error.message}`)
    if (!data || data.length === 0) break

    const rows = data
      .map((row) => {
        const price = row.sold_price ?? row.current_bid
        if (price === null || price === undefined) return null

        return {
          listing_id: row.id as string,
          source_id: row.source_id as string | null,
          make: row.make as string | null,
          model: row.model as string | null,
          year: row.year as number | null,
          horsepower: row.horsepower as number | null,
          hours: row.hours as number | null,
          sold_price: price,
          // A listing with no explicit sold_date is dated by when it last
          // changed, which for an expired listing is when the auction closed.
          sold_date: (row.sold_date as string | null) ?? (row.updated_at as string),
          auction_company: row.auction_company as string | null,
          location_state: row.location_state as string | null,
          original_url: row.original_url as string | null,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("auction_results")
        .upsert(rows, { onConflict: "listing_id" })

      if (upsertError) throw new Error(`archiveEndedListings: upsert failed: ${upsertError.message}`)
      archived += rows.length
    }

    if (data.length < BATCH) break
    from += BATCH
  }

  return { archived }
}
