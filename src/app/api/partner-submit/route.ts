import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const MAX_BODY_FIELD = 2000

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, MAX_BODY_FIELD)
  return trimmed === "" ? null : trimmed
}

/**
 * Programmatic partner application, for anyone integrating from their own site
 * rather than the form at /partner/register.
 *
 * Runs on the anon client, so the insert-only RLS policy on `partners` applies:
 * an applicant can add their own row and cannot read anyone else's.
 */
export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null

  if (!payload) {
    return NextResponse.json({ data: null, error: "Expected a JSON body" }, { status: 400 })
  }

  const companyName = clean(payload.company_name)
  const contactEmail = clean(payload.contact_email)

  if (!companyName || !contactEmail) {
    return NextResponse.json(
      { data: null, error: "company_name and contact_email are required" },
      { status: 400 }
    )
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    return NextResponse.json(
      { data: null, error: "contact_email is not a valid address" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.from("partners").insert({
    company_name: companyName,
    contact_name: clean(payload.contact_name),
    contact_email: contactEmail,
    contact_phone: clean(payload.contact_phone),
    website_url: clean(payload.website_url),
    geographic_coverage: clean(payload.geographic_coverage),
    inventory_type: clean(payload.inventory_type),
    listings_per_month: clean(payload.listings_per_month),
    feed_url: clean(payload.feed_url),
    feed_type: clean(payload.feed_type),
    notes: clean(payload.notes),
  })

  if (error) {
    console.error("[api/partner-submit]", error.message)
    return NextResponse.json(
      { data: null, error: "Could not record the application" },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { received: true }, error: null }, { status: 201 })
}
