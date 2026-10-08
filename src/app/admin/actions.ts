"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth/require-admin"
import { geocodeZip } from "@/lib/geo/zip"
import {
  canonicalCategory,
  canonicalMake,
  canonicalState,
  inferFromTitle,
  parseImages,
  parseInteger,
  parseMoney,
} from "@/lib/ingestion/normalize"
import { mapListing } from "@/lib/listings/queries"
import { patchListing, syncListings } from "@/lib/meilisearch/sync"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ListingDocument } from "@/lib/meilisearch/client"

/**
 * Every action re-checks admin access. A server action is a public endpoint —
 * guarding only the page that renders the form would leave the action open.
 */
async function admin() {
  await requireAdmin()
  return createAdminClient()
}

function text(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

/**
 * Best-effort patch to the search index after an admin write. Logged, never
 * thrown — a Meilisearch hiccup must not turn into a failed admin action when
 * the Postgres write it's reacting to already succeeded. The next full
 * ingestion run or a manual reindex corrects any patch that silently failed.
 */
async function syncIndexPatch(id: string, patch: Partial<ListingDocument>) {
  try {
    await patchListing(id, patch)
  } catch (error) {
    console.error(`[admin] search index patch failed for listing ${id}:`, error)
  }
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------
export async function setListingStatus(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  const status = text(formData.get("status"))

  if (!id || !status) return

  await supabase.from("listings").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
  await syncIndexPatch(id, { status })
  revalidatePath("/admin/listings")
}

/**
 * A listing typed in by an admin, for an auction no feed covers. Goes through
 * the same normalisation as ingested rows (make spelling, category, ZIP to
 * coordinates) so it filters, sorts and radius-searches like any other.
 */
export async function createManualListing(formData: FormData) {
  const supabase = await admin()
  const sourceId = text(formData.get("source_id"))
  const title = text(formData.get("title"))
  const originalUrl = text(formData.get("original_url"))

  let validUrl: string | null = null
  try {
    validUrl = originalUrl && /^https?:$/.test(new URL(originalUrl).protocol) ? originalUrl : null
  } catch {
    validUrl = null
  }
  if (!sourceId || !title || !validUrl) {
    redirect("/admin/listings?add_error=1#add-listing")
  }

  const inferred = inferFromTitle(title)
  const description = text(formData.get("description"))
  const zip = text(formData.get("location_zip"))
  const point = geocodeZip(zip)
  const endRaw = text(formData.get("auction_end_date"))
  const end = endRaw ? new Date(endRaw) : null
  const endDate = end && !Number.isNaN(end.getTime()) ? end.toISOString() : null
  const now = new Date().toISOString()

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      source_id: sourceId,
      external_id: `manual-${crypto.randomUUID()}`,
      title,
      equipment_category: canonicalCategory(
        text(formData.get("equipment_category")) ?? undefined,
        title,
        description ?? undefined
      ),
      make: canonicalMake(text(formData.get("make")) ?? undefined) ?? inferred.make ?? null,
      model: text(formData.get("model")) ?? inferred.model ?? null,
      year:
        parseInteger(text(formData.get("year")) ?? inferred.year, {
          min: 1900,
          max: new Date().getFullYear() + 2,
        }) ?? null,
      hours:
        parseInteger(text(formData.get("hours")) ?? undefined, { min: 0, max: 100_000 }) ?? null,
      horsepower:
        parseInteger(text(formData.get("horsepower")) ?? undefined, { min: 1, max: 2000 }) ??
        null,
      location_city: text(formData.get("location_city")),
      location_state: canonicalState(text(formData.get("location_state")) ?? undefined) ?? null,
      location_zip: zip,
      location_lat: point?.lat ?? null,
      location_lng: point?.lng ?? null,
      auction_end_date: endDate,
      current_bid: parseMoney(text(formData.get("current_bid")) ?? undefined) ?? null,
      description,
      images: parseImages(text(formData.get("images")) ?? undefined),
      original_url: validUrl,
      status: endDate && new Date(endDate).getTime() < Date.now() ? "expired" : "active",
      last_synced_at: now,
      updated_at: now,
    })
    .select("*, source:auction_sources(*)")
    .single()

  if (error || !listing) {
    console.error("[admin] createManualListing:", error?.message)
    redirect("/admin/listings?add_error=1#add-listing")
  }

  try {
    await syncListings([mapListing(listing as Record<string, unknown>)])
  } catch (indexError) {
    console.error("[admin] search index sync failed for manual listing:", indexError)
  }

  revalidatePath("/admin/listings")
  revalidatePath("/search")
  redirect(`/admin/listings?added=${listing.id}`)
}

export async function toggleListingFlag(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  const field = text(formData.get("field"))
  const next = formData.get("next") === "true"

  if (!id || (field !== "is_featured" && field !== "is_sponsored")) return

  await supabase
    .from("listings")
    .update({ [field]: next, updated_at: new Date().toISOString() })
    .eq("id", id)
  await syncIndexPatch(id, { [field]: next })

  revalidatePath("/admin/listings")
  revalidatePath("/")
  revalidatePath("/search")
}

/**
 * Manual photos for a listing whose source publishes none — the fix for a
 * featured or sponsored placement that would otherwise show the placeholder.
 * Only absolute https URLs are kept (next/image will not load anything else).
 */
export async function setListingImages(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  if (!id) return

  const images = String(formData.get("images") ?? "")
    .split(/[\s,]+/)
    .map((url) => url.trim())
    .filter((url) => {
      try {
        return new URL(url).protocol === "https:"
      } catch {
        return false
      }
    })

  await supabase
    .from("listings")
    .update({ images, updated_at: new Date().toISOString() })
    .eq("id", id)

  revalidatePath("/admin/listings")
  revalidatePath(`/listing/${id}`)
  revalidatePath("/")
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------
export async function upsertSource(formData: FormData) {
  const supabase = await admin()

  const id = text(formData.get("id"))
  const payload = {
    name: text(formData.get("name")),
    website_url: text(formData.get("website_url")),
    logo_url: text(formData.get("logo_url")),
    description: text(formData.get("description")),
    geographic_coverage: text(formData.get("geographic_coverage")),
    integration_type: text(formData.get("integration_type")) ?? "manual",
    api_endpoint: text(formData.get("api_endpoint")),
    status: text(formData.get("status")) ?? "pending",
    is_featured: formData.get("is_featured") === "on",
    is_sponsored: formData.get("is_sponsored") === "on",
  }

  if (!payload.name || !payload.website_url) return

  if (id) await supabase.from("auction_sources").update(payload).eq("id", id)
  else await supabase.from("auction_sources").insert(payload)

  revalidatePath("/admin/sources")
}

export async function setSourceStatus(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  const status = text(formData.get("status"))

  if (!id || !status) return

  await supabase.from("auction_sources").update({ status }).eq("id", id)
  revalidatePath("/admin/sources")
}

// ---------------------------------------------------------------------------
// Outreach CRM
// ---------------------------------------------------------------------------
export async function updateOutreachContact(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  if (!id) return

  const status = text(formData.get("status"))
  const payload: Record<string, unknown> = {
    contact_name: text(formData.get("contact_name")),
    contact_email: text(formData.get("contact_email")),
    contact_phone: text(formData.get("contact_phone")),
    existing_api_info: text(formData.get("existing_api_info")),
    integration_request: text(formData.get("integration_request")),
    follow_up_date: text(formData.get("follow_up_date")),
    notes: text(formData.get("notes")),
  }

  if (status) {
    payload.status = status
    // Stamp the date the pipeline moved, so follow-up reporting has a clock.
    if (status === "responded") payload.response_date = new Date().toISOString()
  }

  await supabase.from("outreach_contacts").update(payload).eq("id", id)
  revalidatePath("/admin/outreach")
}

export async function setOutreachStatus(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  const status = text(formData.get("status"))
  if (!id || !status) return

  const payload: Record<string, unknown> = { status }
  if (status === "contacted") payload.outreach_date = new Date().toISOString()
  if (status === "responded") payload.response_date = new Date().toISOString()

  await supabase.from("outreach_contacts").update(payload).eq("id", id)
  revalidatePath("/admin/outreach")
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------
export async function setPartnerStatus(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  const status = text(formData.get("status"))
  const notes = text(formData.get("notes"))

  if (!id || !status) return

  await supabase
    .from("partners")
    .update({ status, notes, reviewed_at: new Date().toISOString() })
    .eq("id", id)

  revalidatePath("/admin/partners")
}

/**
 * Approving a partner creates the auction_sources row their listings hang off,
 * so the ingestion worker has somewhere to write once their feed is wired up.
 */
export async function approvePartnerAsSource(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  if (!id) return

  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!partner) return
  const record = partner as Record<string, unknown>

  if (!record.source_id) {
    const { data: source } = await supabase
      .from("auction_sources")
      .insert({
        name: record.company_name as string,
        website_url: (record.website_url as string) ?? "https://example.com",
        geographic_coverage: record.geographic_coverage as string | null,
        integration_type: (record.feed_type as string) ?? "manual",
        api_endpoint: record.feed_url as string | null,
        status: "pending",
      })
      .select("id")
      .maybeSingle()

    if (source) {
      await supabase
        .from("partners")
        .update({ source_id: (source as Record<string, unknown>).id as string })
        .eq("id", id)
    }
  }

  await supabase
    .from("partners")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id)

  revalidatePath("/admin/partners")
  revalidatePath("/admin/sources")
}

/**
 * Publishes a partner's hand-entered listing. It becomes an ordinary listing
 * under the partner's auction source (keyed partner-<submission id>, so a
 * second approval cannot duplicate it) and goes straight into search.
 */
export async function approvePartnerSubmission(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  if (!id) return

  const { data: submission } = await supabase
    .from("partner_submissions")
    .select("*, partner:partners(id, source_id, company_name)")
    .eq("id", id)
    .maybeSingle()
  if (!submission) return

  const record = submission as Record<string, unknown>
  const partner = record.partner as Record<string, unknown> | null
  const sourceId = partner?.source_id as string | null
  if (!sourceId) return

  const now = new Date().toISOString()
  const endDate = record.auction_end_date as string | null
  const { data: listing, error } = await supabase
    .from("listings")
    .upsert(
      {
        source_id: sourceId,
        external_id: `partner-${id}`,
        title: record.title,
        equipment_category: record.equipment_category ?? "other",
        make: record.make,
        model: record.model,
        year: record.year,
        horsepower: record.horsepower,
        hours: record.hours,
        condition: record.condition,
        location_city: record.location_city,
        location_state: record.location_state,
        auction_company: partner?.company_name,
        auction_end_date: endDate,
        current_bid: record.current_bid,
        description: record.description,
        original_url: record.original_url,
        status: endDate && new Date(endDate).getTime() < Date.now() ? "expired" : "active",
        last_synced_at: now,
        updated_at: now,
      },
      { onConflict: "source_id,external_id" }
    )
    .select("*, source:auction_sources(*)")
    .single()

  if (error || !listing) {
    console.error("[admin] approvePartnerSubmission:", error?.message)
    return
  }

  await supabase
    .from("partner_submissions")
    .update({ status: "approved", listing_id: listing.id, reviewed_at: now })
    .eq("id", id)

  // A partner publishing by hand has no feed to switch on, so the source goes
  // live with its first approved listing.
  await supabase
    .from("auction_sources")
    .update({ status: "active" })
    .eq("id", sourceId)
    .eq("status", "pending")

  try {
    await syncListings([mapListing(listing as Record<string, unknown>)])
  } catch (indexError) {
    console.error("[admin] search index sync failed for partner listing:", indexError)
  }

  revalidatePath("/admin/partners")
  revalidatePath("/admin/listings")
  revalidatePath("/partner/dashboard")
  revalidatePath("/search")
}

export async function rejectPartnerSubmission(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  if (!id) return

  await supabase
    .from("partner_submissions")
    .update({
      status: "rejected",
      review_notes: text(formData.get("review_notes")),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)

  revalidatePath("/admin/partners")
  revalidatePath("/partner/dashboard")
}

// ---------------------------------------------------------------------------
// Sponsored placements
// ---------------------------------------------------------------------------
export async function createPlacement(formData: FormData) {
  const supabase = await admin()

  const listingId = text(formData.get("listing_id"))
  const sourceId = text(formData.get("source_id"))
  const placementType = text(formData.get("placement_type"))

  if (!placementType || (!listingId && !sourceId)) return

  await supabase.from("sponsored_placements").insert({
    listing_id: listingId,
    source_id: sourceId,
    placement_type: placementType,
    start_date: text(formData.get("start_date")),
    end_date: text(formData.get("end_date")),
    is_active: true,
  })

  // A placement on a listing is what makes the "Sponsored" label appear.
  if (listingId) {
    await supabase.from("listings").update({ is_sponsored: true }).eq("id", listingId)
    await syncIndexPatch(listingId, { is_sponsored: true })
  }

  revalidatePath("/admin/sponsored")
  revalidatePath("/")
  revalidatePath("/search")
}

export async function setPlacementActive(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  const next = formData.get("next") === "true"
  if (!id) return

  const { data: placement } = await supabase
    .from("sponsored_placements")
    .select("listing_id")
    .eq("id", id)
    .maybeSingle()

  await supabase.from("sponsored_placements").update({ is_active: next }).eq("id", id)

  const listingId = (placement as Record<string, unknown> | null)?.listing_id as string | null
  if (listingId) {
    // Only drop the listing's label when no other active placement covers it.
    const { count } = await supabase
      .from("sponsored_placements")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId)
      .eq("is_active", true)

    const isSponsored = (count ?? 0) > 0
    await supabase.from("listings").update({ is_sponsored: isSponsored }).eq("id", listingId)
    await syncIndexPatch(listingId, { is_sponsored: isSponsored })
  }

  revalidatePath("/admin/sponsored")
  revalidatePath("/")
  revalidatePath("/search")
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function setUserRole(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  const role = text(formData.get("role"))

  if (!id || !role || !["user", "admin", "partner"].includes(role)) return

  await supabase.from("profiles").update({ role }).eq("id", id)
  revalidatePath("/admin/users")
}
