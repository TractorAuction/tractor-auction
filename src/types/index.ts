export type AuctionSource = {
  id: string
  name: string
  website_url: string
  logo_url?: string
  description?: string
  geographic_coverage?: string
  integration_type:
    | "api"
    | "rss"
    | "xml"
    | "csv"
    | "manual"
    | "ftp"
    | "email"
    | "google_sheets"
  api_endpoint?: string
  status: "active" | "inactive" | "pending"
  is_featured: boolean
  is_sponsored: boolean
  last_synced_at?: string
  created_at: string
  /**
   * Connector configuration for this source's feed: where it lives and how its
   * fields map onto listings columns. Shaped by FeedConfig in lib/ingestion.
   */
  feed_config?: Record<string, unknown>
  /** Only true once the feed is authorized and its mapping is verified. */
  sync_enabled?: boolean
  sync_interval_minutes?: number
  last_sync_status?: "running" | "success" | "partial" | "failed"
  last_sync_error?: string
}

export type SyncRun = {
  id: string
  source_id: string
  status: "running" | "success" | "partial" | "failed"
  trigger: "cron" | "manual" | "backfill"
  started_at: string
  finished_at?: string
  duration_ms?: number
  items_seen: number
  items_created: number
  items_updated: number
  items_skipped: number
  items_expired: number
  item_errors: Array<{ externalId?: string; reason: string }>
  error_message?: string
  created_at: string
}

export type Listing = {
  id: string
  external_id?: string
  source_id: string
  source?: AuctionSource
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
  location_lat?: number
  location_lng?: number
  auction_company?: string
  auction_end_date?: string
  auction_type?: string
  current_bid?: number
  buy_it_now_price?: number
  description?: string
  images: string[]
  original_url: string
  is_featured: boolean
  is_sponsored: boolean
  sponsored_rank?: number
  status: "active" | "expired" | "sold"
  sold_price?: number
  sold_date?: string
  last_synced_at?: string
  created_at: string
  updated_at: string
}

export type OutreachContact = {
  id: string
  company_name: string
  website_url?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  geographic_coverage?: string
  inventory_type?: string
  existing_api_info?: string
  /** 1 (highest priority) to 7. Drives the outreach email angle. */
  tier?: number
  integration_request?: string
  status:
    | "pending"
    | "contacted"
    | "follow_up"
    | "responded"
    | "api_requested"
    | "api_received"
    | "integration_pending"
    | "integrated"
    | "declined"
    | "no_response"
  outreach_date?: string
  follow_up_date?: string
  response_date?: string
  notes?: string
  source_id?: string
  created_at: string
}

/** "distance" only applies when a ZIP is given; it falls back to ending_soon otherwise. */
export type SortOption = "ending_soon" | "recently_added" | "price_asc" | "price_desc" | "distance"

export type SearchFilters = {
  query?: string
  equipment_category?: string
  make?: string
  model?: string
  year_min?: number
  year_max?: number
  horsepower_min?: number
  horsepower_max?: number
  hours_max?: number
  price_min?: number
  price_max?: number
  location_state?: string
  source_id?: string
  ending_before?: string
  /** Buyer's ZIP; with radius_miles, limits results to that distance. */
  zip?: string
  /** Miles from zip. Undefined = nationwide (zip then only drives "nearest" sort). */
  radius_miles?: number
  sort_by?: SortOption
}

export type SavedSearch = {
  id: string
  user_id: string
  name: string
  filters: SearchFilters
  alert_enabled: boolean
  created_at: string
}

export type SearchResult = {
  listings: Listing[]
  total: number
  page: number
  pageSize: number
}

/** Consistent envelope for every API route response. */
export type ApiResponse<T> = { data: T; error: null } | { data: null; error: string }
