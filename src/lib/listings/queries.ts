import { createClient } from "@/lib/supabase/server"
import type { AuctionSource, Listing, SearchFilters, SearchResult, SortOption } from "@/types"

export const DEFAULT_PAGE_SIZE = 24

// Every listing query pulls its source alongside it so cards and detail pages
// can render the auction-house badge without a second round trip.
const LISTING_SELECT = "*, source:auction_sources(*)"

type Row = Record<string, unknown>

/** Postgres nulls become undefined so optional fields match the Listing type. */
function optional<T>(value: unknown): T | undefined {
  return value === null || value === undefined ? undefined : (value as T)
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** images is jsonb, so it can arrive as an array, a JSON string, or null. */
function toImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string")
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : []
    } catch {
      return []
    }
  }
  return []
}

export function mapListing(row: Row): Listing {
  const source = row.source as Row | null

  return {
    id: row.id as string,
    external_id: optional<string>(row.external_id),
    source_id: row.source_id as string,
    source: source
      ? {
          id: source.id as string,
          name: source.name as string,
          website_url: source.website_url as string,
          logo_url: optional<string>(source.logo_url),
          description: optional<string>(source.description),
          geographic_coverage: optional<string>(source.geographic_coverage),
          integration_type: (optional<string>(source.integration_type) ??
            "manual") as AuctionSource["integration_type"],
          api_endpoint: optional<string>(source.api_endpoint),
          status: (optional<string>(source.status) ?? "pending") as AuctionSource["status"],
          is_featured: Boolean(source.is_featured),
          is_sponsored: Boolean(source.is_sponsored),
          last_synced_at: optional<string>(source.last_synced_at),
          created_at: source.created_at as string,
        }
      : undefined,
    title: optional<string>(row.title),
    equipment_category: (optional<string>(row.equipment_category)) ?? "tractor",
    make: optional<string>(row.make),
    model: optional<string>(row.model),
    year: toNumber(row.year),
    horsepower: toNumber(row.horsepower),
    hours: toNumber(row.hours),
    condition: optional<string>(row.condition),
    drive_type: optional<string>(row.drive_type),
    serial_number: optional<string>(row.serial_number),
    lot_number: optional<string>(row.lot_number),
    location_city: optional<string>(row.location_city),
    location_state: optional<string>(row.location_state),
    location_zip: optional<string>(row.location_zip),
    location_lat: toNumber(row.location_lat),
    location_lng: toNumber(row.location_lng),
    auction_company: optional<string>(row.auction_company),
    auction_end_date: optional<string>(row.auction_end_date),
    auction_type: optional<string>(row.auction_type),
    current_bid: toNumber(row.current_bid),
    buy_it_now_price: toNumber(row.buy_it_now_price),
    description: optional<string>(row.description),
    images: toImages(row.images),
    original_url: row.original_url as string,
    is_featured: Boolean(row.is_featured),
    is_sponsored: Boolean(row.is_sponsored),
    sponsored_rank: toNumber(row.sponsored_rank),
    status: (optional<string>(row.status) ?? "active") as Listing["status"],
    sold_price: toNumber(row.sold_price),
    sold_date: optional<string>(row.sold_date),
    last_synced_at: optional<string>(row.last_synced_at),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

// PostgREST reads `or()` as a comma-separated list wrapped in parentheses, and
// treats % as a wildcard, so those characters must not survive from user input.
function sanitizeQuery(query: string) {
  return query.replace(/[,()%\\*]/g, " ").trim()
}

const SORT_COLUMNS: Record<SortOption, { column: string; ascending: boolean }> = {
  // Listings with no end date sort last rather than pretending to be urgent.
  ending_soon: { column: "auction_end_date", ascending: true },
  recently_added: { column: "created_at", ascending: false },
  price_asc: { column: "current_bid", ascending: true },
  price_desc: { column: "current_bid", ascending: false },
}

export async function searchListings(
  filters: SearchFilters = {},
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<SearchResult> {
  const supabase = await createClient()
  const safePage = Math.max(1, Math.trunc(page) || 1)
  const from = (safePage - 1) * pageSize

  let query = supabase
    .from("listings")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("status", "active")

  const search = filters.query ? sanitizeQuery(filters.query) : ""
  if (search) {
    query = query.or(
      ["title", "make", "model", "description"]
        .map((column) => `${column}.ilike.%${search}%`)
        .join(",")
    )
  }

  if (filters.equipment_category) query = query.eq("equipment_category", filters.equipment_category)
  if (filters.make) query = query.ilike("make", filters.make)
  if (filters.model) query = query.ilike("model", filters.model)
  if (filters.location_state) query = query.eq("location_state", filters.location_state)
  if (filters.source_id) query = query.eq("source_id", filters.source_id)

  if (filters.year_min !== undefined) query = query.gte("year", filters.year_min)
  if (filters.year_max !== undefined) query = query.lte("year", filters.year_max)
  if (filters.horsepower_min !== undefined) query = query.gte("horsepower", filters.horsepower_min)
  if (filters.horsepower_max !== undefined) query = query.lte("horsepower", filters.horsepower_max)
  if (filters.hours_max !== undefined) query = query.lte("hours", filters.hours_max)
  if (filters.price_min !== undefined) query = query.gte("current_bid", filters.price_min)
  if (filters.price_max !== undefined) query = query.lte("current_bid", filters.price_max)
  if (filters.ending_before) query = query.lte("auction_end_date", filters.ending_before)

  const sort = SORT_COLUMNS[filters.sort_by ?? "ending_soon"]

  const { data, error, count } = await query
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .range(from, from + pageSize - 1)

  if (error) throw new Error(`Failed to search listings: ${error.message}`)

  return {
    listings: (data ?? []).map((row) => mapListing(row as Row)),
    total: count ?? 0,
    page: safePage,
    pageSize,
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle()

  // A malformed uuid is a 404 to the visitor, not a server error.
  if (error) {
    if (error.code === "22P02") return null
    throw new Error(`Failed to load listing: ${error.message}`)
  }

  return data ? mapListing(data as Row) : null
}

/** Same make first, then anything else in the category, never the listing itself. */
export async function getSimilarListings(listing: Listing, limit = 4): Promise<Listing[]> {
  const supabase = await createClient()

  const base = () =>
    supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("status", "active")
      .neq("id", listing.id)
      .order("auction_end_date", { ascending: true, nullsFirst: false })
      .limit(limit)

  const collected = new Map<string, Listing>()

  if (listing.make) {
    const { data } = await base().eq("make", listing.make)
    for (const row of data ?? []) {
      const item = mapListing(row as Row)
      collected.set(item.id, item)
    }
  }

  if (collected.size < limit) {
    const { data } = await base().eq("equipment_category", listing.equipment_category)
    for (const row of data ?? []) {
      if (collected.size >= limit) break
      const item = mapListing(row as Row)
      if (!collected.has(item.id)) collected.set(item.id, item)
    }
  }

  return Array.from(collected.values()).slice(0, limit)
}

export type FilterFacets = {
  makes: string[]
  states: string[]
  sources: { id: string; name: string }[]
}

/**
 * Options for the filter dropdowns. Postgres has no DISTINCT through PostgREST,
 * so values are deduped here over a capped scan — fine at seed scale, and this
 * moves to Meilisearch facets once the search index is live (Day 7).
 */
export async function getFilterFacets(): Promise<FilterFacets> {
  const supabase = await createClient()

  const [listingsResult, sourcesResult] = await Promise.all([
    supabase
      .from("listings")
      .select("make, location_state")
      .eq("status", "active")
      .limit(2000),
    supabase.from("auction_sources").select("id, name").eq("status", "active").order("name"),
  ])

  const makes = new Set<string>()
  const states = new Set<string>()

  for (const row of listingsResult.data ?? []) {
    const record = row as Row
    const make = optional<string>(record.make)
    const state = optional<string>(record.location_state)
    if (make) makes.add(make)
    if (state) states.add(state)
  }

  return {
    makes: Array.from(makes).sort(),
    states: Array.from(states).sort(),
    sources: (sourcesResult.data ?? []).map((row) => ({
      id: (row as Row).id as string,
      name: (row as Row).name as string,
    })),
  }
}

export async function getFeaturedListings(limit = 4): Promise<Listing[]> {
  const { listings } = await searchListings({ sort_by: "ending_soon" }, 1, limit * 4)
  const featured = listings.filter((listing) => listing.is_featured || listing.is_sponsored)
  // Fall back to the soonest-ending listings so the homepage is never empty
  // before any placements have been sold.
  return (featured.length > 0 ? featured : listings).slice(0, limit)
}

export async function getRecentlyAdded(limit = 4): Promise<Listing[]> {
  const { listings } = await searchListings({ sort_by: "recently_added" }, 1, limit)
  return listings
}

export async function getEndingSoon(limit = 4): Promise<Listing[]> {
  const { listings } = await searchListings({ sort_by: "ending_soon" }, 1, limit)
  return listings
}
