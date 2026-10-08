import type { Listing } from "@/types"

/**
 * The status to show a visitor. A lot whose end date has passed reads as ended
 * even before the expiry sweep flips its row, so a closed auction is never
 * presented as live in the gap between cron ticks.
 */
export function effectiveStatus(listing: Listing, now = Date.now()): Listing["status"] {
  if (
    listing.status === "active" &&
    listing.auction_end_date &&
    new Date(listing.auction_end_date).getTime() < now
  ) {
    return "expired"
  }
  return listing.status
}
