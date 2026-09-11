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
    const email = await generateOutreachEmail(
      mapOutreachContact(data as Record<string, unknown>),
      body.stageId
    )
    return NextResponse.json({ data: email, error: null })
  } catch (error) {
    console.error("[api/outreach/preview]", error)
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Failed to draft email" },
      { status: 500 }
    )
  }
}
