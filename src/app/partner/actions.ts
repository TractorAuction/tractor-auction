"use server"

import { redirect } from "next/navigation"

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

  const { error } = await supabase.from("partners").insert({
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
