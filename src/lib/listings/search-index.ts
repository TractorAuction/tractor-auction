import { listingsIndex } from "@/lib/meilisearch/client"
import { createClient } from "@/lib/supabase/server"
import type { SearchFilters, SearchResult, SortOption } from "@/types"

import { DEFAULT_PAGE_SIZE, getActiveSources, getFilterFacets, mapListing, searchListings, type FilterFacets } from "./queries"

// Meilisearch answers "which ids, in what order, how many total" — the actual
// row (joined source, every column) always comes back from Postgres, by id.
// This keeps Postgres the one place the full Listing shape is maintained; see
// the comment on ListingDocument in lib/meilisearch/client.ts.
const LISTING_SELECT = "*, source:auction_sources(*)"

const SORT: Record<SortOption, string[]> = {
  ending_soon: ["auction_end_date:asc"],
  recently_added: ["created_at:desc"],
  price_asc: ["current_bid:asc"],
  price_desc: ["current_bid:desc"],
}

/** '"' and '\' would break out of a quoted filter value; a make or model
 *  legitimately containing either is vanishingly unlikely and not worth the risk. */
function quote(value: string): string {
  return `"${value.replace(/["\\]/g, "")}"`
}

function buildFilter(filters: SearchFilters): string {
  // Mirrors the Postgres path: a lot whose end date has passed is not live, even
  // if the expiry sweep has not reached it yet.
  const clauses = [
    `status = "active"`,
    `(auction_end_date IS NULL OR auction_end_date >= ${Date.now()})`,
  ]

  if (filters.equipment_category) clauses.push(`equipment_category = ${quote(filters.equipment_category)}`)
  if (filters.make) clauses.push(`make = ${quote(filters.make)}`)
  if (filters.model) clauses.push(`model = ${quote(filters.model)}`)
  if (filters.location_state) clauses.push(`location_state = ${quote(filters.location_state)}`)
  if (filters.source_id) clauses.push(`source_id = ${quote(filters.source_id)}`)

  if (filters.year_min !== undefined) clauses.push(`year >= ${filters.year_min}`)
  if (filters.year_max !== undefined) clauses.push(`year <= ${filters.year_max}`)
  if (filters.horsepower_min !== undefined) clauses.push(`horsepower >= ${filters.horsepower_min}`)
  if (filters.horsepower_max !== undefined) clauses.push(`horsepower <= ${filters.horsepower_max}`)
  if (filters.hours_max !== undefined) clauses.push(`hours <= ${filters.hours_max}`)
  if (filters.price_min !== undefined) clauses.push(`current_bid >= ${filters.price_min}`)
  if (filters.price_max !== undefined) clauses.push(`current_bid <= ${filters.price_max}`)
  if (filters.ending_before) {
    const ms = new Date(filters.ending_before).getTime()
    if (Number.isFinite(ms)) clauses.push(`auction_end_date <= ${ms}`)
  }

  return clauses.join(" AND ")
}

/**
 * Same contract as searchListings (lib/listings/queries.ts) but backed by
 * Meilisearch: typo-tolerant text matching and relevance ranking instead of
 * `ilike`, with Postgres hydrating the actual rows afterward.
 */
export async function searchListingsIndexed(
  filters: SearchFilters = {},
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<SearchResult> {
  const safePage = Math.max(1, Math.trunc(page) || 1)
  const offset = (safePage - 1) * pageSize

  const result = await listingsIndex().search(filters.query ?? "", {
    filter: buildFilter(filters),
    sort: SORT[filters.sort_by ?? "ending_soon"],
    offset,
    limit: pageSize,
  })

  const ids = result.hits.map((hit) => hit.id)
  if (ids.length === 0) {
    return { listings: [], total: result.estimatedTotalHits, page: safePage, pageSize }
  }

  const supabase = await createClient()
  // Postgres is the source of truth for status: a listing expired since its
  // index document was last written is dropped here rather than shown as live.
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .in("id", ids)
    .eq("status", "active")

  if (error) throw new Error(`Failed to hydrate search results: ${error.message}`)

  // Postgres does not promise to return rows in the `in()` list's order, but
  // Meilisearch's relevance/sort order is the entire point of this path.
  const byId = new Map((data ?? []).map((row) => [row.id as string, row]))
  const listings = ids
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => mapListing(row as Record<string, unknown>))

  return { listings, total: result.estimatedTotalHits, page: safePage, pageSize }
}

export type IndexedFacets = { makes: string[]; states: string[] }

/** Facet counts from the index. Throws on failure — getSearchFacets() below
 *  decides whether and how to fall back to Postgres. */
async function getFilterFacetsIndexed(): Promise<IndexedFacets> {
  const result = await listingsIndex().search("", {
    filter: `status = "active"`,
    facets: ["make", "location_state"],
    limit: 0,
  })

  const distribution = result.facetDistribution ?? {}
  const names = (field: string) => Object.keys(distribution[field] ?? {}).sort()

  return { makes: names("make"), states: names("location_state") }
}

/**
 * Single entry point both the search page and /api/search use. Meilisearch is
 * additive, never a one-way door: any failure here — index not configured yet,
 * Cloud instance unreachable, a bad filter — falls through to the Postgres
 * `ilike` path that worked before this existed, so search degrades instead
 * of breaking.
 */
export async function searchListingsSafe(
  filters: SearchFilters = {},
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<SearchResult> {
  try {
    return await searchListingsIndexed(filters, page, pageSize)
  } catch (error) {
    console.error("[search-index] falling back to Postgres search:", error)
    return searchListings(filters, page, pageSize)
  }
}

/** Same fallback contract as searchListingsSafe, for the filter dropdowns. */
export async function getSearchFacets(): Promise<FilterFacets> {
  try {
    const [indexed, sources] = await Promise.all([getFilterFacetsIndexed(), getActiveSources()])
    return { ...indexed, sources }
  } catch (error) {
    console.error("[search-index] falling back to Postgres facets:", error)
    return getFilterFacets()
  }
}
