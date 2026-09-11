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

export type SortOption = "ending_soon" | "recently_added" | "price_asc" | "price_desc"

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
