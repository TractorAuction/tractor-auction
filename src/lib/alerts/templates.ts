import { formatCurrency, formatDate } from "@/lib/format"
import { SITE_URL } from "@/lib/seo/slug"
import type { Listing } from "@/types"

export type AlertEmail = { subject: string; text: string }

function listingLine(listing: Listing): string {
  const title = listing.title ?? [listing.year, listing.make, listing.model].filter(Boolean).join(" ")
  const price = formatCurrency(listing.current_bid)
  const ends = formatDate(listing.auction_end_date)
  const parts = [price, ends ? `ends ${ends}` : null].filter(Boolean).join(" · ")
  return `${title}${parts ? ` — ${parts}` : ""}\n${SITE_URL}/listing/${listing.id}`
}

function footer(unsubscribeUrl: string): string {
  return [
    "",
    "—",
    "You're getting this because you set up an alert on TractorAuction.com.",
    `Turn off all email alerts: ${unsubscribeUrl}`,
  ].join("\n")
}

/** New listings matching a saved search since it was last checked. */
export function savedSearchMatchesEmail({
  searchName,
  searchPath,
  listings,
  unsubscribeUrl,
}: {
  searchName: string
  /** "/search?make=..." for this saved search, so "See all" reopens it. */
  searchPath: string
  listings: Listing[]
  unsubscribeUrl: string
}): AlertEmail {
  const subject =
    listings.length === 1
      ? `1 new match for "${searchName}"`
      : `${listings.length} new matches for "${searchName}"`

  const body = [
    `New listings matching your saved search "${searchName}":`,
    "",
    listings.map(listingLine).join("\n\n"),
    "",
    `See all matches: ${SITE_URL}${searchPath}`,
    footer(unsubscribeUrl),
  ].join("\n")

  return { subject, text: body }
}

/** A watchlisted listing's auction closes within 24 hours. */
export function endingSoonEmail({
  listings,
  unsubscribeUrl,
}: {
  listings: Listing[]
  unsubscribeUrl: string
}): AlertEmail {
  const subject =
    listings.length === 1
      ? "A tractor on your watchlist ends in 24 hours"
      : `${listings.length} tractors on your watchlist end within 24 hours`

  const body = [
    "These watchlisted auctions are ending soon:",
    "",
    listings.map(listingLine).join("\n\n"),
    "",
    `View your watchlist: ${SITE_URL}/account/watchlist`,
    footer(unsubscribeUrl),
  ].join("\n")

  return { subject, text: body }
}
