import { mapListing, searchListings } from "@/lib/listings/queries"
import { createClient } from "@/lib/supabase/server"
import type { AuctionSource, Listing, SearchFilters } from "@/types"

type Row = Record<string, unknown>

export type PromotedSlot = {
  listing: Listing
  placementId?: string
}

/**
 * Promoted listings are fetched and rendered separately from organic results
 * rather than being blended into them. Keeping the two sets apart in the data
 * layer is what makes the "clearly separated" rule enforceable in the UI —
 * an organic query can never accidentally return a paid row.
 */
export async function getPromotedListings(
  filters: SearchFilters = {},
  limit = 3
): Promise<PromotedSlot[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Active placements first, so impressions can be attributed to a placement.
  const { data: placements } = await supabase
    .from("sponsored_placements")
    .select("id, listing_id")
    .eq("is_active", true)
    .in("placement_type", ["featured_listing", "sponsored_listing"])
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .limit(50)

  const placementByListing = new Map<string, string>()
  for (const row of placements ?? []) {
    const record = row as Row
    const listingId = record.listing_id as string | null
    if (listingId && !placementByListing.has(listingId)) {
      placementByListing.set(listingId, record.id as string)
    }
  }

  // Promoted rows still have to match what the visitor searched for — a paid
  // slot never overrides the filters.
  const { listings } = await searchListings(
    { ...filters, sort_by: "ending_soon" },
    1,
    Math.max(limit * 6, 24)
  )

  const promoted = listings.filter((listing) => listing.is_sponsored || listing.is_featured)

  return promoted.slice(0, limit).map((listing) => ({
    listing,
    placementId: placementByListing.get(listing.id),
  }))
}

/** IDs of the promoted listings, so the organic query can exclude them. */
export function promotedIds(slots: PromotedSlot[]) {
  return new Set(slots.map((slot) => slot.listing.id))
}

export type FeaturedSource = AuctionSource & { placementId?: string }

/** Paid source placement for the search sidebar. */
export async function getFeaturedSource(): Promise<FeaturedSource | null> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from("sponsored_placements")
    .select("id, source:auction_sources(*)")
    .eq("is_active", true)
    .eq("placement_type", "featured_source")
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .limit(1)
    .maybeSingle()

  const record = data as Row | null
  const source = record?.source as Row | null
  if (!source) return null

  return {
    id: source.id as string,
    name: source.name as string,
    website_url: source.website_url as string,
    logo_url: (source.logo_url as string | null) ?? undefined,
    description: (source.description as string | null) ?? undefined,
    geographic_coverage: (source.geographic_coverage as string | null) ?? undefined,
    integration_type: ((source.integration_type as string) ??
      "manual") as AuctionSource["integration_type"],
    status: ((source.status as string) ?? "pending") as AuctionSource["status"],
    is_featured: Boolean(source.is_featured),
    is_sponsored: Boolean(source.is_sponsored),
    created_at: source.created_at as string,
    placementId: record?.id as string | undefined,
  }
}

/** Homepage promotional slot. Returns nothing when nothing is sold. */
export async function getHomepagePlacement(): Promise<PromotedSlot | null> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from("sponsored_placements")
    .select("id, listing:listings(*, source:auction_sources(*))")
    .eq("is_active", true)
    .eq("placement_type", "homepage")
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .limit(1)
    .maybeSingle()

  const record = data as Row | null
  const listing = record?.listing as Row | null
  if (!listing) return null

  return {
    listing: mapListing(listing),
    placementId: record?.id as string | undefined,
  }
}
