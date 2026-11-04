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
    /** Set only after the admin has confirmed a second email to the same address. */
    allowDuplicate?: boolean
    /** Other rows this one email also covers (same inbox); they advance too. */
    alsoContactIds?: string[]
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

  const supabase = createAdminClient()

  // Validated so they can be dropped into a PostgREST filter safely.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const alsoIds = (body.alsoContactIds ?? []).filter((id) => UUID.test(id) && id !== body.contactId)
  if (!UUID.test(body.contactId)) {
    return NextResponse.json({ data: null, error: "Invalid contactId" }, { status: 400 })
  }

  // Two CRM rows can share one inbox (Ritchie Bros. owns IronPlanet and both
  // list the same person). A second cold email to someone we just contacted
  // reads as spam, so it needs an explicit confirmation.
  if (!body.allowDuplicate) {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const { data: earlier } = await supabase
      .from("outreach_contacts")
      .select("company_name")
      .ilike("contact_email", body.to.trim())
      .not("id", "in", `(${[body.contactId, ...alsoIds].join(",")})`)
      .gte("outreach_date", since)
      .limit(1)

    if (earlier && earlier.length > 0) {
      return NextResponse.json(
        {
          data: null,
          error: `${body.to} was already emailed for ${earlier[0].company_name} in the last 30 days. Not sent.`,
        },
        { status: 409 }
      )
    }
  }

  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from,
    to: body.to,
    // tractorauction.com has no mailbox (no MX records), so a reply to the
    // From address bounces. OUTREACH_REPLY_TO points replies at an inbox
    // someone actually reads until the domain has one.
    replyTo: process.env.OUTREACH_REPLY_TO || undefined,
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

  await supabase
    .from("outreach_contacts")
    .update({
      status: "contacted",
      outreach_date: now.toISOString(),
      follow_up_date: followUp.toISOString(),
    })
    .eq("id", body.contactId)

  // Only rows that really share this inbox, so the field can't be used to
  // mark arbitrary companies as contacted.
  if (alsoIds.length > 0) {
    await supabase
      .from("outreach_contacts")
      .update({
        status: "contacted",
        outreach_date: now.toISOString(),
        follow_up_date: followUp.toISOString(),
      })
      .in("id", alsoIds)
      .ilike("contact_email", body.to.trim())
  }

  return NextResponse.json({ data: { id: data?.id ?? null }, error: null })
}
