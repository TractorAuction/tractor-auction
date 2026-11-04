import { NextRequest, NextResponse } from "next/server"

import { mapOutreachContact } from "@/lib/admin/queries"
import { requireAdmin } from "@/lib/auth/require-admin"
import { generateOutreachEmail } from "@/lib/outreach/generate-email"
import { createAdminClient } from "@/lib/supabase/admin"

/** Drafts an email for review. Nothing is sent and nothing is recorded. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 403 }
    )
  }

  const body = (await request.json().catch(() => null)) as {
    contactId?: string
    stageId?: string
    /** Other companies at the same inbox; the email must name them too. */
    alsoCovers?: string[]
  } | null

  if (!body?.contactId || !body.stageId) {
    return NextResponse.json(
      { data: null, error: "contactId and stageId are required" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("outreach_contacts")
    .select("*")
    .eq("id", body.contactId)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ data: null, error: "Contact not found" }, { status: 404 })
  }

  try {
    const contact = mapOutreachContact(data as Record<string, unknown>)
    const others = (body.alsoCovers ?? []).map((name) => name.trim()).filter(Boolean).slice(0, 5)
    if (others.length > 0) {
      // The prompt names every business listed in the company name.
      contact.company_name = `${contact.company_name} (including ${others.join(" and ")})`
    }
    const email = await generateOutreachEmail(contact, body.stageId)
    return NextResponse.json({ data: email, error: null })
  } catch (error) {
    console.error("[api/outreach/preview]", error)
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Failed to draft email" },
      { status: 500 }
    )
  }
}
