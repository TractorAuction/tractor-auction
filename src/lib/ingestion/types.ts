import type { AuctionSource } from "@/types"

/**
 * One item exactly as the source handed it over: a flat bag of strings keyed by
 * whatever that feed calls its fields. Connectors are responsible for flattening
 * their format down to this; nothing past the connector knows about XML nodes,
 * CSV columns or JSON envelopes.
 */
export type RawItem = Record<string, string | undefined>

/** A listing ready to be written, after mapping, coercion and validation. */
export type NormalizedListing = {
  external_id: string
  source_id: string
  title?: string
  equipment_category: string
  make?: string
  model?: string
  year?: number
  horsepower?: number
  hours?: number
  condition?: string
  drive_type?: string
  serial_number?: string
  lot_number?: string
  location_city?: string
  location_state?: string
  location_zip?: string
  auction_company?: string
  auction_end_date?: string
  auction_type?: string
  current_bid?: number
  buy_it_now_price?: number
  description?: string
  images: string[]
  original_url: string
  status: "active" | "expired" | "sold"
  sold_price?: number
  sold_date?: string
}

/** Why a single item was dropped. Collected per run rather than thrown. */
export type ItemError = {
  /** The source's own id for the item, when it got far enough to have one. */
  externalId?: string
  reason: string
}

/**
 * Field mapping is data, not code: `fieldMap` points each listings column at the
 * raw key that carries it, so a partner feed with `"EquipMake"` needs a row edit
 * rather than a new connector.
 */
export type FeedConfig = {
  url?: string
  /** Dotted path to the array of items inside a JSON envelope, e.g. "data.results". */
  itemsPath?: string
  fieldMap?: Record<string, string>
  /** Values forced onto every item from this feed, e.g. auction_company. */
  staticFields?: Record<string, string | number>
  /** Name of the env var holding the feed's bearer token or API key. */
  authHeaderEnv?: string
  authHeaderName?: string
  headers?: Record<string, string>
  /** Query param used to page, plus how far to follow it. */
  pageParam?: string
  pageSize?: number
  pageSizeParam?: string
  maxPages?: number
  /** CSV only. */
  delimiter?: string
  /** RSS/XML only: the element name that wraps one item. */
  itemElement?: string
}

export type ConnectorContext = {
  source: AuctionSource
  config: FeedConfig
  /** Connectors must stop fetching further pages once this passes. */
  deadline: number
}

/**
 * A connector's only job is to produce raw items. It does not map, validate,
 * or write — which is what lets one connector serve every source that speaks
 * the same wire format.
 */
export type Connector = {
  name: string
  fetchItems(context: ConnectorContext): Promise<{ items: RawItem[]; truncated: boolean }>
}

export type SyncSummary = {
  sourceId: string
  sourceName: string
  runId?: string
  status: "success" | "partial" | "failed" | "skipped"
  itemsSeen: number
  itemsCreated: number
  itemsUpdated: number
  itemsSkipped: number
  itemErrors: ItemError[]
  errorMessage?: string
  durationMs: number
  /** Dry runs only: the first few mapped listings, for eyeballing a mapping. */
  sample?: NormalizedListing[]
}
