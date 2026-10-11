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
 * Re-archiving keeps a row in sync: a listing whose price changes before this
 * next runs (current_bid corrected by a late feed update) is updated, not
 * skipped as "already archived."
 *
 * Deliberately NOT `upsert(..., { onConflict: "listing_id" })`. The uniqueness
 * on auction_results.listing_id is a PARTIAL index (`where listing_id is not
 * null`, migration 0007), and Postgres only matches a partial index to
 * ON CONFLICT when the statement repeats its WHERE clause, which PostgREST
 * never does. That failed with "no unique or exclusion constraint matching
 * the ON CONFLICT specification" the first time a closed lot had a price.
 * Existing rows are looked up and updated by primary key instead; new ones
 * are inserted, and the partial index still guards against duplicates.
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
      const { data: existing, error: existingError } = await supabase
        .from("auction_results")
        .select("id, listing_id")
        .in("listing_id", rows.map((row) => row.listing_id))

      if (existingError) {
        throw new Error(`archiveEndedListings: failed to read archive: ${existingError.message}`)
      }

      const archivedId = new Map(
        (existing ?? []).map((row) => [row.listing_id as string, row.id as string])
      )
      const updates = rows
        .filter((row) => archivedId.has(row.listing_id))
        .map((row) => ({ ...row, id: archivedId.get(row.listing_id) as string }))
      const inserts = rows.filter((row) => !archivedId.has(row.listing_id))

      if (updates.length > 0) {
        // Conflict on the primary key, which is a real, full constraint.
        const { error } = await supabase.from("auction_results").upsert(updates, { onConflict: "id" })
        if (error) throw new Error(`archiveEndedListings: update failed: ${error.message}`)
      }
      if (inserts.length > 0) {
        const { error } = await supabase.from("auction_results").insert(inserts)
        if (error) throw new Error(`archiveEndedListings: insert failed: ${error.message}`)
      }
      archived += rows.length
    }

    if (data.length < BATCH) break
    from += BATCH
  }

  return { archived }
}
