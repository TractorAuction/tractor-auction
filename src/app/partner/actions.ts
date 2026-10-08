"use server"

import { redirect } from "next/navigation"

import { revalidatePath } from "next/cache"

import { canonicalCategory, canonicalMake, canonicalState } from "@/lib/ingestion/normalize"
import { getCurrentPartner } from "@/lib/partners/current"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

function text(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

/**
 * Partner applications come from the public form, so this runs on the anon
 * client and relies on the insert-only RLS policy — an applicant can add their
 * own row but cannot read the queue back.
 */
export async function submitPartnerApplication(formData: FormData) {
  const companyName = text(formData.get("company_name"))
  const contactEmail = text(formData.get("contact_email"))

  if (!companyName || !contactEmail) {
    redirect("/partner/register?error=missing")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("partners").insert({
    // Applying while signed in links the account now; otherwise the record is
    // claimed on first sign-in with the contact email (lib/partners/current).
    user_id: user?.id ?? null,
    company_name: companyName,
    contact_name: text(formData.get("contact_name")),
    contact_email: contactEmail,
    contact_phone: text(formData.get("contact_phone")),
    website_url: text(formData.get("website_url")),
    geographic_coverage: text(formData.get("geographic_coverage")),
    inventory_type: text(formData.get("inventory_type")),
    listings_per_month: text(formData.get("listings_per_month")),
    feed_url: text(formData.get("feed_url")),
    feed_type: text(formData.get("feed_type")),
    notes: text(formData.get("notes")),
  })

  if (error) {
    console.error("[partner/register]", error.message)
    redirect("/partner/register?error=failed")
  }

  redirect("/partner/register?submitted=1")
}

function integer(value: FormDataEntryValue | null, min: number, max: number): number | null {
  const raw = text(value)
  if (!raw) return null
  const parsed = Number.parseInt(raw.replace(/[^0-9-]/g, ""), 10)
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null
}

function httpsUrl(value: FormDataEntryValue | null): string | null {
  const raw = text(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null
  } catch {
    return null
  }
}

/**
 * A single listing typed in by an approved partner without a feed. Held in
 * partner_submissions until an admin approves it into listings, so nothing a
 * partner types reaches the public site unreviewed.
 */
export async function submitPartnerListing(formData: FormData) {
  const { partner } = await getCurrentPartner()
  if (!partner || partner.status !== "approved") {
    redirect("/partner/dashboard?listing_error=not_approved")
  }

  const title = text(formData.get("title"))
  const originalUrl = httpsUrl(formData.get("original_url"))
  if (!title || !originalUrl) {
    redirect("/partner/dashboard?listing_error=missing#submit-listing")
  }

  const endRaw = text(formData.get("auction_end_date"))
  const endDate = endRaw ? new Date(endRaw) : null
  const bidRaw = text(formData.get("current_bid"))
  const bid = bidRaw ? Number(bidRaw.replace(/[^0-9.]/g, "")) : null

  const make = text(formData.get("make"))
  const description = text(formData.get("description"))

  const { error } = await createAdminClient()
    .from("partner_submissions")
    .insert({
      partner_id: partner.id,
      title: title.slice(0, 200),
      equipment_category: canonicalCategory(
        text(formData.get("equipment_category")) ?? undefined,
        title,
        description ?? undefined
      ),
      make: canonicalMake(make ?? undefined) ?? null,
      model: text(formData.get("model")),
      year: integer(formData.get("year"), 1900, new Date().getFullYear() + 2),
      horsepower: integer(formData.get("horsepower"), 1, 2000),
      hours: integer(formData.get("hours"), 0, 100_000),
      condition: text(formData.get("condition")),
      location_city: text(formData.get("location_city")),
      location_state: canonicalState(text(formData.get("location_state")) ?? undefined) ?? null,
      auction_end_date: endDate && !Number.isNaN(endDate.getTime()) ? endDate.toISOString() : null,
      current_bid: bid !== null && Number.isFinite(bid) ? bid : null,
      description: description?.slice(0, 5000) ?? null,
      original_url: originalUrl,
    })

  if (error) {
    console.error("[partner/submit-listing]", error.message)
    redirect("/partner/dashboard?listing_error=failed#submit-listing")
  }

  revalidatePath("/partner/dashboard")
  revalidatePath("/admin/partners")
  redirect("/partner/dashboard?listing_submitted=1#submit-listing")
}
