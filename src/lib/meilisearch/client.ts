import { Meilisearch } from "meilisearch"

/**
 * Server-only client, authenticated with the admin key. Never import this into
 * a client component — it can write, delete the index, and read every field
 * regardless of what's meant to stay off the public internet.
 */
export const meilisearch = new Meilisearch({
  host: process.env.MEILISEARCH_HOST!,
  apiKey: process.env.MEILISEARCH_API_KEY,
})

export const LISTINGS_INDEX = "listings"

export function listingsIndex() {
  return meilisearch.index<ListingDocument>(LISTINGS_INDEX)
}

/**
 * What actually lives in the index: a flat, filterable/sortable/searchable
 * subset of a Listing, not the full record. Meilisearch answers "which ids
 * match, in what order, with what facet counts" — the full row (joined source,
 * every column) is always re-fetched from Postgres afterward. That keeps
 * Postgres the single place the full Listing shape is maintained, so a source
 * rename or a newly-added column never needs a reindex to show up correctly.
 */
export type ListingDocument = {
  id: string
  title: string
  make: string
  model: string
  description: string
  equipment_category: string
  year: number | null
  horsepower: number | null
  hours: number | null
  current_bid: number | null
  buy_it_now_price: number | null
  location_state: string
  source_id: string
  status: string
  is_featured: boolean
  is_sponsored: boolean
  /** Epoch ms. Stored numeric rather than ISO text so `sort` is unambiguous
   *  and a missing date can be pushed to either end of "ending soon". */
  auction_end_date: number | null
  created_at: number
}

export const LISTINGS_INDEX_SETTINGS = {
  // Order is relevance priority: a hit in the title should always outrank the
  // same word only appearing in the description.
  searchableAttributes: ["title", "make", "model", "description"],
  filterableAttributes: [
    "status",
    "equipment_category",
    "make",
    "model",
    "location_state",
    "source_id",
    "year",
    "horsepower",
    "hours",
    "current_bid",
    "auction_end_date",
    "is_featured",
    "is_sponsored",
  ],
  sortableAttributes: ["auction_end_date", "created_at", "current_bid"],
}
