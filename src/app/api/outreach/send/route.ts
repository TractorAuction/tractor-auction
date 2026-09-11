import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

import { requireAdmin } from "@/lib/auth/require-admin"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Sends a reviewed draft and advances the contact to "contacted".
 *
 * The subject and body come from the request rather than being regenerated, so
 * what the admin approved in the preview is exactly what goes out.
 */
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
    to?: string
    subject?: string
    body?: string
    followUpDays?: number
  } | null

  if (!body?.contactId || !body.to || !body.subject || !body.body) {
    return NextResponse.json(
      { data: null, error: "contactId, to, subject and body are required" },
      { status: 400 }
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.OUTREACH_FROM_EMAIL

  if (!apiKey || apiKey.startsWith("your_") || !from) {
    return NextResponse.json(
      {
        data: null,
        error:
          "Email sending is not configured. Set RESEND_API_KEY and OUTREACH_FROM_EMAIL in .env.local.",
      },
      { status: 503 }
    )
  }

  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from,
    to: body.to,
    subject: body.subject,
    text: body.body,
  })

  if (error) {
    console.error("[api/outreach/send]", error)
    return NextResponse.json({ data: null, error: error.message }, { status: 502 })
  }

  // Only advance the pipeline once the send actually succeeded.
  const now = new Date()
  const followUp = new Date(now.getTime() + (body.followUpDays ?? 7) * 86_400_000)

  const supabase = createAdminClient()
  await supabase
    .from("outreach_contacts")
    .update({
      status: "contacted",
      outreach_date: now.toISOString(),
      follow_up_date: followUp.toISOString(),
    })
    .eq("id", body.contactId)

  return NextResponse.json({ data: { id: data?.id ?? null }, error: null })
}
