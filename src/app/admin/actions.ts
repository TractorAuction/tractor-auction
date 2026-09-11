"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"

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

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------
export async function setListingStatus(formData: FormData) {
  const supabase = await admin()
  const id = text(formData.get("id"))
  const status = text(formData.get("status"))

  if (!id || !status) return

  await supabase.from("listings").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
  revalidatePath("/admin/listings")
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

  revalidatePath("/admin/listings")
  revalidatePath("/")
  revalidatePath("/search")
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

    await supabase.from("listings").update({ is_sponsored: (count ?? 0) > 0 }).eq("id", listingId)
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
