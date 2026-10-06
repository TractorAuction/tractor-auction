import { mapListing } from "@/lib/listings/queries"
import { syncListings } from "@/lib/meilisearch/sync"
import { createAdminClient } from "@/lib/supabase/admin"
import type { AuctionSource } from "@/types"

import { csvFeedConnector } from "./connectors/csv-feed"
import { jsonApiConnector } from "./connectors/json-api"
import { xmlFeedConnector } from "./connectors/xml-feed"
import { normalizeItem } from "./normalize"
import type { Connector, FeedConfig, ItemError, NormalizedListing, SyncSummary } from "./types"

/**
 * Connectors are chosen by wire format, not by company. Four of these cover
 * every integration_type the schema allows, which is the whole point: onboarding
 * an authorized source is a row in auction_sources, not a new file in here.
 */
const CONNECTORS: Record<AuctionSource["integration_type"], Connector | null> = {
  api: jsonApiConnector,
  rss: xmlFeedConnector,
  xml: xmlFeedConnector,
  csv: csvFeedConnector,
  ftp: csvFeedConnector,
  google_sheets: csvFeedConnector,
  // Listings arrive through the partner portal or admin UI, not over the wire.
  manual: null,
  email: null,
}

/** Rows written per request. Postgres handles far more, but a smaller batch
 *  keeps one bad row's blast radius small and the progress log readable. */
const UPSERT_BATCH = 500

/** Bounded so a feed that fails every row cannot write a huge jsonb blob. */
const MAX_LOGGED_ERRORS = 50

export type RunOptions = {
  trigger?: "cron" | "manual" | "backfill"
  /** Wall-clock budget. Connectors stop paging once it passes, and the run
   *  records itself as partial rather than being killed mid-write. */
  budgetMs?: number
  /**
   * Fetches and maps the feed but writes nothing — no listings, no sync_runs
   * row, no source timestamp. This is how a field mapping gets verified against
   * real payloads before the source is enabled, which matters because a wrong
   * mapping writes plausible-looking rubbish rather than failing loudly.
   */
  dryRun?: boolean
  /** Config to use instead of the stored feed_config, for previewing a mapping. */
  configOverride?: FeedConfig
}

export async function runSource(
  source: AuctionSource,
  { trigger = "cron", budgetMs = 60_000, dryRun = false, configOverride }: RunOptions = {}
): Promise<SyncSummary> {
  const startedAt = Date.now()
  const deadline = startedAt + budgetMs
  const supabase = createAdminClient()

  const base: SyncSummary = {
    sourceId: source.id,
    sourceName: source.name,
    status: "failed",
    itemsSeen: 0,
    itemsCreated: 0,
    itemsUpdated: 0,
    itemsSkipped: 0,
    itemErrors: [],
    durationMs: 0,
  }

  const connector = CONNECTORS[source.integration_type]
  if (!connector) {
    return {
      ...base,
      status: "skipped",
      errorMessage: `integration_type "${source.integration_type}" has no automated feed; listings arrive manually`,
      durationMs: Date.now() - startedAt,
    }
  }

  // The run row is written before any fetching, so a crash still leaves evidence.
  let runId: string | undefined
  if (!dryRun) {
    const { data: runRow, error: runError } = await supabase
      .from("sync_runs")
      .insert({ source_id: source.id, status: "running", trigger })
      .select("id")
      .single()

    if (runError) {
      return {
        ...base,
        errorMessage: `could not open a sync_runs row: ${runError.message}`,
        durationMs: Date.now() - startedAt,
      }
    }
    runId = runRow.id as string
  }

  const config = configOverride ?? ((source.feed_config ?? {}) as FeedConfig)
  const itemErrors: ItemError[] = []

  try {
    const { items, truncated } = await connector.fetchItems({ source, config, deadline })

    const listings: NormalizedListing[] = []
    for (const item of items) {
      const result = normalizeItem(item, {
        sourceId: source.id,
        config,
        baseUrl: source.website_url,
      })
      if ("error" in result) {
        if (itemErrors.length < MAX_LOGGED_ERRORS) itemErrors.push(result.error)
        continue
      }
      listings.push(result.listing)
    }

    const { unique, duplicates } = dedupe(listings)

    const skipped = items.length - unique.length
    const status: SyncSummary["status"] =
      truncated || itemErrors.length > 0 || duplicates > 0 ? "partial" : "success"

    if (dryRun) {
      return {
        ...base,
        status,
        itemsSeen: items.length,
        // Nothing is written, so these report what a real run would have done.
        itemsCreated: unique.length,
        itemsUpdated: 0,
        itemsSkipped: skipped,
        itemErrors,
        sample: unique.slice(0, 3),
        durationMs: Date.now() - startedAt,
      }
    }

    const written = await upsertListings(supabase, source.id, unique, runId!)

    // Best-effort: the search index is additive. A Meilisearch hiccup must not
    // fail an ingestion run whose actual job — getting rows into Postgres — has
    // already succeeded; it downgrades the run to partial and says why instead.
    const searchSyncError = await syncWrittenToSearchIndex(supabase, source.id, unique)

    const finalStatus: SyncSummary["status"] = searchSyncError ? "partial" : status

    await supabase
      .from("sync_runs")
      .update({
        status: finalStatus,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        items_seen: items.length,
        items_created: written.created,
        items_updated: written.updated,
        items_skipped: skipped,
        item_errors: itemErrors,
        error_message:
          [
            truncated ? "stopped early on the time budget; remaining pages resume next run" : null,
            searchSyncError ? `search index sync failed: ${searchSyncError}` : null,
          ]
            .filter(Boolean)
            .join("; ") || null,
      })
      .eq("id", runId)

    await supabase
      .from("auction_sources")
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_status: finalStatus,
        last_sync_error: searchSyncError,
      })
      .eq("id", source.id)

    return {
      ...base,
      runId,
      status: finalStatus,
      itemsSeen: items.length,
      itemsCreated: written.created,
      itemsUpdated: written.updated,
      itemsSkipped: skipped,
      itemErrors,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (dryRun) {
      return { ...base, errorMessage: message, itemErrors, durationMs: Date.now() - startedAt }
    }

    await supabase
      .from("sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        item_errors: itemErrors,
        error_message: message,
      })
      .eq("id", runId)

    await supabase
      .from("auction_sources")
      .update({ last_sync_status: "failed", last_sync_error: message })
      .eq("id", source.id)

    return {
      ...base,
      runId,
      errorMessage: message,
      itemErrors,
      durationMs: Date.now() - startedAt,
    }
  }
}

/**
 * Feeds repeat themselves — the same lot on two pages, or relisted under one id.
 * Postgres refuses an upsert that touches the same conflict target twice in one
 * statement, so the batch is deduped here, last occurrence winning.
 */
function dedupe(listings: NormalizedListing[]): { unique: NormalizedListing[]; duplicates: number } {
  const byId = new Map<string, NormalizedListing>()
  let duplicates = 0

  for (const listing of listings) {
    if (byId.has(listing.external_id)) duplicates += 1
    byId.set(listing.external_id, listing)
  }

  return { unique: [...byId.values()], duplicates }
}

type Supabase = ReturnType<typeof createAdminClient>

async function upsertListings(
  supabase: Supabase,
  sourceId: string,
  listings: NormalizedListing[],
  runId: string
): Promise<{ created: number; updated: number }> {
  if (listings.length === 0) return { created: 0, updated: 0 }

  // Which ids already exist decides created vs updated. Asked per batch so the
  // IN list stays small, rather than pulling every id the source has ever had.
  let created = 0
  let updated = 0
  const now = new Date().toISOString()

  for (let offset = 0; offset < listings.length; offset += UPSERT_BATCH) {
    const batch = listings.slice(offset, offset + UPSERT_BATCH)
    const ids = batch.map((listing) => listing.external_id)

    const { data: existing, error: existingError } = await supabase
      .from("listings")
      .select("external_id")
      .eq("source_id", sourceId)
      .in("external_id", ids)

    if (existingError) throw new Error(`existing-id lookup failed: ${existingError.message}`)

    const known = new Set((existing ?? []).map((row) => row.external_id as string))

    const { error } = await supabase.from("listings").upsert(
      batch.map((listing) => ({
        ...listing,
        last_synced_at: now,
        updated_at: now,
        last_sync_run_id: runId,
      })),
      { onConflict: "source_id,external_id" }
    )

    if (error) throw new Error(`upsert failed: ${error.message}`)

    for (const id of ids) {
      if (known.has(id)) updated += 1
      else created += 1
    }
  }

  return { created, updated }
}

/**
 * Re-fetches the rows just written (with their generated id, defaults, and
 * joined source) and pushes them into Meilisearch. Re-fetching rather than
 * reconstructing documents from NormalizedListing keeps the index an honest
 * mirror of what Postgres actually holds, id included.
 *
 * Returns an error message on failure, or null on success — never throws,
 * since a search-index outage must not take ingestion down with it.
 */
async function syncWrittenToSearchIndex(
  supabase: Supabase,
  sourceId: string,
  listings: NormalizedListing[]
): Promise<string | null> {
  if (listings.length === 0) return null

  try {
    const ids = listings.map((listing) => listing.external_id)
    const { data, error } = await supabase
      .from("listings")
      .select("*, source:auction_sources(*)")
      .eq("source_id", sourceId)
      .in("external_id", ids)

    if (error) throw new Error(error.message)

    await syncListings((data ?? []).map((row) => mapListing(row as Record<string, unknown>)))
    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[ingestion] search index sync failed:", message)
    return message
  }
}

/**
 * Picks up every source whose interval has elapsed. This is the "cron per
 * source" the plan calls for, without N platform cron entries: one tick asks
 * which sources are due, which also means a newly-added source starts syncing
 * without touching the deployment.
 */
export async function runDueSources({
  trigger = "cron",
  budgetMs = 60_000,
  dryRun = false,
}: RunOptions = {}): Promise<SyncSummary[]> {
  const supabase = createAdminClient()
  const startedAt = Date.now()

  const { data, error } = await supabase
    .from("auction_sources")
    .select("*")
    .eq("status", "active")
    .eq("sync_enabled", true)
    .order("last_synced_at", { ascending: true, nullsFirst: true })

  if (error) throw new Error(`could not list sources: ${error.message}`)

  const due = (data ?? []).filter((row) => {
    const interval = Number(row.sync_interval_minutes ?? 360)
    if (!row.last_synced_at) return true
    return Date.now() - new Date(row.last_synced_at as string).getTime() >= interval * 60_000
  })

  const summaries: SyncSummary[] = []

  for (const row of due) {
    const remaining = budgetMs - (Date.now() - startedAt)
    // Leave room to record the result; a run with no time left waits for the
    // next tick, where it sorts first because last_synced_at is still oldest.
    if (remaining < 10_000) break

    summaries.push(
      await runSource(row as unknown as AuctionSource, { trigger, budgetMs: remaining, dryRun })
    )
  }

  return summaries
}
