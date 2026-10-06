import { mapListing } from "@/lib/listings/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Listing } from "@/types"

import { LISTINGS_INDEX, LISTINGS_INDEX_SETTINGS, type ListingDocument, listingsIndex, meilisearch } from "./client"

const REINDEX_BATCH = 1000

/** A missing or unparseable date sorts last for "ending soon", not first. */
function toEpochMs(value: string | undefined): number | null {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

export function toSearchDocument(listing: Listing): ListingDocument {
  return {
    id: listing.id,
    title: listing.title ?? [listing.year, listing.make, listing.model].filter(Boolean).join(" "),
    make: listing.make ?? "",
    model: listing.model ?? "",
    description: listing.description ?? "",
    equipment_category: listing.equipment_category,
    year: listing.year ?? null,
    horsepower: listing.horsepower ?? null,
    hours: listing.hours ?? null,
    current_bid: listing.current_bid ?? null,
    buy_it_now_price: listing.buy_it_now_price ?? null,
    location_state: listing.location_state ?? "",
    source_id: listing.source_id,
    status: listing.status,
    is_featured: listing.is_featured,
    is_sponsored: listing.is_sponsored,
    auction_end_date: toEpochMs(listing.auction_end_date),
    created_at: toEpochMs(listing.created_at) ?? Date.now(),
  }
}

/**
 * Creates the index if it doesn't exist and (re)applies its settings. Safe to
 * call on every deploy or before every reindex — Meilisearch no-ops an
 * unchanged setting and only reprocesses the ones that actually differ.
 */
export async function ensureIndexConfigured(): Promise<void> {
  const index = listingsIndex()

  try {
    await index.getRawInfo()
  } catch {
    // getRawInfo fails both when the index is missing and on a transient
    // network blip. Either way, attempt creation; if the index actually does
    // exist, Meilisearch's "already exists" error is swallowed here and the
    // updateSettings call below is the real signal — if the index genuinely
    // isn't reachable, that call fails loudly instead of this one failing quietly.
    await meilisearch.createIndex(LISTINGS_INDEX, { primaryKey: "id" }).waitTask().catch(() => {})
  }

  await index.updateSettings(LISTINGS_INDEX_SETTINGS).waitTask()
}

/** Upserts a batch of already-fetched listings. Full document replace — use
 *  this from ingestion and reindexAll, where the complete row is already in hand. */
export async function syncListings(listings: Listing[]): Promise<void> {
  if (listings.length === 0) return
  const documents = listings.map(toSearchDocument)
  await listingsIndex().addDocuments(documents).waitTask()
}

/**
 * Patches a field on one document without fetching or resending the rest.
 * This is what the admin mutations use — flipping is_featured on a listing
 * does not need its description and images round-tripped just to flip a flag.
 */
export async function patchListing(id: string, patch: Partial<ListingDocument>): Promise<void> {
  await listingsIndex()
    .updateDocuments([{ id, ...patch }])
    .waitTask()
}

export async function removeListings(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await listingsIndex().deleteDocuments(ids).waitTask()
}

/**
 * Full rebuild from Postgres, batched. This is the recovery path: if the index
 * is ever suspected to have drifted (a failed sync, a changed document shape
 * after a code change), this is idempotent and safe to rerun — every row is
 * fully replaced, not merged.
 */
export async function reindexAll(): Promise<{ indexed: number }> {
  await ensureIndexConfigured()

  const supabase = createAdminClient()
  let indexed = 0
  let from = 0

  for (;;) {
    const { data, error } = await supabase
      .from("listings")
      .select("*, source:auction_sources(*)")
      .range(from, from + REINDEX_BATCH - 1)

    if (error) throw new Error(`reindexAll: failed to read listings: ${error.message}`)
    if (!data || data.length === 0) break

    await syncListings(data.map((row) => mapListing(row as Record<string, unknown>)))

    indexed += data.length
    if (data.length < REINDEX_BATCH) break
    from += REINDEX_BATCH
  }

  return { indexed }
}
