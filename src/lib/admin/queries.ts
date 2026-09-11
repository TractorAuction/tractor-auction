import { mapListing } from "@/lib/listings/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import type { AuctionSource, Listing, OutreachContact } from "@/types"

type Row = Record<string, unknown>

function optional<T>(value: unknown): T | undefined {
  return value === null || value === undefined ? undefined : (value as T)
}

export type AdminStats = {
  totalListings: number
  activeListings: number
  activeSources: number
  pendingSources: number
  clicksToday: number
  clicksAllTime: number
  totalUsers: number
  newUsersThisWeek: number
  pendingPartners: number
  outreachPending: number
  outreachIntegrated: number
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

/** Counts for the dashboard home. Each is a HEAD request, so no rows travel. */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createAdminClient()

  const [
    totalListings,
    activeListings,
    activeSources,
    pendingSources,
    clicksToday,
    clicksAllTime,
    totalUsers,
    newUsers,
    pendingPartners,
    outreachPending,
    outreachIntegrated,
  ] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("auction_sources").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("auction_sources").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("click_events").select("id", { count: "exact", head: true }).gte("clicked_at", startOfToday()),
    supabase.from("click_events").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", daysAgo(7)),
    supabase.from("partners").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("outreach_contacts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("outreach_contacts").select("id", { count: "exact", head: true }).eq("status", "integrated"),
  ])

  return {
    totalListings: totalListings.count ?? 0,
    activeListings: activeListings.count ?? 0,
    activeSources: activeSources.count ?? 0,
    pendingSources: pendingSources.count ?? 0,
    clicksToday: clicksToday.count ?? 0,
    clicksAllTime: clicksAllTime.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    newUsersThisWeek: newUsers.count ?? 0,
    pendingPartners: pendingPartners.count ?? 0,
    outreachPending: outreachPending.count ?? 0,
    outreachIntegrated: outreachIntegrated.count ?? 0,
  }
}

export type AdminListingFilters = {
  query?: string
  status?: string
  source_id?: string
  page?: number
}

export const ADMIN_PAGE_SIZE = 25

export async function getAdminListings(filters: AdminListingFilters = {}) {
  const supabase = createAdminClient()
  const page = Math.max(1, filters.page ?? 1)
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let query = supabase
    .from("listings")
    .select("*, source:auction_sources(*)", { count: "exact" })

  if (filters.query) {
    const safe = filters.query.replace(/[,()%\\*]/g, " ").trim()
    if (safe) {
      query = query.or(
        ["title", "make", "model", "external_id"].map((c) => `${c}.ilike.%${safe}%`).join(",")
      )
    }
  }
  if (filters.status) query = query.eq("status", filters.status)
  if (filters.source_id) query = query.eq("source_id", filters.source_id)

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)

  if (error) throw new Error(`Failed to load listings: ${error.message}`)

  return {
    listings: (data ?? []).map((row) => mapListing(row as Row)) as Listing[],
    total: count ?? 0,
    page,
    pageSize: ADMIN_PAGE_SIZE,
  }
}

export function mapSource(row: Row): AuctionSource {
  return {
    id: row.id as string,
    name: row.name as string,
    website_url: row.website_url as string,
    logo_url: optional<string>(row.logo_url),
    description: optional<string>(row.description),
    geographic_coverage: optional<string>(row.geographic_coverage),
    integration_type: (optional<string>(row.integration_type) ??
      "manual") as AuctionSource["integration_type"],
    api_endpoint: optional<string>(row.api_endpoint),
    status: (optional<string>(row.status) ?? "pending") as AuctionSource["status"],
    is_featured: Boolean(row.is_featured),
    is_sponsored: Boolean(row.is_sponsored),
    last_synced_at: optional<string>(row.last_synced_at),
    created_at: row.created_at as string,
  }
}

/** Sources with their live listing counts, for the sources table. */
export async function getAdminSources() {
  const supabase = createAdminClient()

  const [sourcesResult, listingsResult] = await Promise.all([
    supabase.from("auction_sources").select("*").order("name"),
    supabase.from("listings").select("source_id").eq("status", "active").limit(10000),
  ])

  if (sourcesResult.error) {
    throw new Error(`Failed to load sources: ${sourcesResult.error.message}`)
  }

  const counts = new Map<string, number>()
  for (const row of listingsResult.data ?? []) {
    const sourceId = (row as Row).source_id as string | null
    if (sourceId) counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1)
  }

  return (sourcesResult.data ?? []).map((row) => ({
    ...mapSource(row as Row),
    listingCount: counts.get((row as Row).id as string) ?? 0,
  }))
}

export function mapOutreachContact(row: Row): OutreachContact {
  return {
    id: row.id as string,
    company_name: row.company_name as string,
    website_url: optional<string>(row.website_url),
    contact_name: optional<string>(row.contact_name),
    contact_email: optional<string>(row.contact_email),
    contact_phone: optional<string>(row.contact_phone),
    geographic_coverage: optional<string>(row.geographic_coverage),
    inventory_type: optional<string>(row.inventory_type),
    existing_api_info: optional<string>(row.existing_api_info),
    tier: row.tier === null || row.tier === undefined ? undefined : Number(row.tier),
    integration_request: optional<string>(row.integration_request),
    status: (optional<string>(row.status) ?? "pending") as OutreachContact["status"],
    outreach_date: optional<string>(row.outreach_date),
    follow_up_date: optional<string>(row.follow_up_date),
    response_date: optional<string>(row.response_date),
    notes: optional<string>(row.notes),
    source_id: optional<string>(row.source_id),
    created_at: row.created_at as string,
  }
}

export async function getOutreachContacts(
  filters: { status?: string; due?: boolean; tier?: number } = {}
) {
  const supabase = createAdminClient()

  let query = supabase.from("outreach_contacts").select("*")

  if (filters.status) query = query.eq("status", filters.status)
  if (filters.tier) query = query.eq("tier", filters.tier)
  if (filters.due) query = query.lte("follow_up_date", new Date().toISOString())

  // Tier order is the work order: Tier 1 first, unranked rows last.
  const { data, error } = await query
    .order("tier", { ascending: true, nullsFirst: false })
    .order("company_name")

  if (error) throw new Error(`Failed to load outreach contacts: ${error.message}`)

  return (data ?? []).map((row) => mapOutreachContact(row as Row))
}

export type Partner = {
  id: string
  company_name: string
  contact_name?: string
  contact_email: string
  contact_phone?: string
  website_url?: string
  geographic_coverage?: string
  inventory_type?: string
  listings_per_month?: string
  feed_url?: string
  feed_type?: string
  status: "pending" | "approved" | "rejected" | "suspended"
  source_id?: string
  notes?: string
  reviewed_at?: string
  created_at: string
}

function mapPartner(row: Row): Partner {
  return {
    id: row.id as string,
    company_name: row.company_name as string,
    contact_name: optional<string>(row.contact_name),
    contact_email: row.contact_email as string,
    contact_phone: optional<string>(row.contact_phone),
    website_url: optional<string>(row.website_url),
    geographic_coverage: optional<string>(row.geographic_coverage),
    inventory_type: optional<string>(row.inventory_type),
    listings_per_month: optional<string>(row.listings_per_month),
    feed_url: optional<string>(row.feed_url),
    feed_type: optional<string>(row.feed_type),
    status: (optional<string>(row.status) ?? "pending") as Partner["status"],
    source_id: optional<string>(row.source_id),
    notes: optional<string>(row.notes),
    reviewed_at: optional<string>(row.reviewed_at),
    created_at: row.created_at as string,
  }
}

export async function getPartners(status?: string) {
  const supabase = createAdminClient()

  let query = supabase.from("partners").select("*")
  if (status) query = query.eq("status", status)

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to load partners: ${error.message}`)

  return (data ?? []).map((row) => mapPartner(row as Row))
}

export type AdminUser = {
  id: string
  email?: string
  full_name?: string
  role: string
  created_at: string
}

export async function getAdminUsers() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) throw new Error(`Failed to load users: ${error.message}`)

  return (data ?? []).map((row) => {
    const record = row as Row
    return {
      id: record.id as string,
      email: optional<string>(record.email),
      full_name: optional<string>(record.full_name),
      role: (optional<string>(record.role) ?? "user") as string,
      created_at: record.created_at as string,
    } satisfies AdminUser
  })
}

export type SponsoredPlacement = {
  id: string
  listing_id?: string
  source_id?: string
  placement_type: string
  start_date?: string
  end_date?: string
  impressions: number
  clicks: number
  is_active: boolean
  created_at: string
  listing_title?: string
  source_name?: string
}

export async function getSponsoredPlacements() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("sponsored_placements")
    .select("*, listing:listings(title), source:auction_sources(name)")
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to load placements: ${error.message}`)

  return (data ?? []).map((row) => {
    const record = row as Row
    const listing = record.listing as Row | null
    const source = record.source as Row | null

    return {
      id: record.id as string,
      listing_id: optional<string>(record.listing_id),
      source_id: optional<string>(record.source_id),
      placement_type: (optional<string>(record.placement_type) ?? "featured_listing") as string,
      start_date: optional<string>(record.start_date),
      end_date: optional<string>(record.end_date),
      impressions: Number(record.impressions ?? 0),
      clicks: Number(record.clicks ?? 0),
      is_active: Boolean(record.is_active),
      created_at: record.created_at as string,
      listing_title: listing ? (optional<string>(listing.title) ?? undefined) : undefined,
      source_name: source ? (optional<string>(source.name) ?? undefined) : undefined,
    } satisfies SponsoredPlacement
  })
}

/** Click totals per source, for the partner traffic report. */
export async function getClicksBySource(days = 30) {
  const supabase = createAdminClient()

  const [clicksResult, sourcesResult] = await Promise.all([
    supabase
      .from("click_events")
      .select("source_id")
      .gte("clicked_at", daysAgo(days))
      .limit(50000),
    supabase.from("auction_sources").select("id, name"),
  ])

  const names = new Map<string, string>()
  for (const row of sourcesResult.data ?? []) {
    names.set((row as Row).id as string, (row as Row).name as string)
  }

  const counts = new Map<string, number>()
  for (const row of clicksResult.data ?? []) {
    const sourceId = (row as Row).source_id as string | null
    if (sourceId) counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([sourceId, clicks]) => ({
      sourceId,
      name: names.get(sourceId) ?? "Unknown source",
      clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
}
