import { NextResponse } from "next/server"

import { requireIngestSecret } from "@/lib/ingestion/authorize"
import { generateOutreachEmail } from "@/lib/outreach/generate-email"
import { createAdminClient } from "@/lib/supabase/admin"
import type { OutreachContact } from "@/types"

/**
 * Bulk-drafts outreach emails through the real generation path
 * (generateOutreachEmail — same system prompt, same model, same per-tier
 * angle logic the admin composer uses) without needing an interactive admin
 * session. Exists because this often needs to run from outside a browser —
 * preparing a batch for review before anyone opens the admin UI.
 *
 * Drafts only. Nothing is sent, and no contact's status or dates change —
 * that still only happens through /api/outreach/send, which a signed-in
 * admin triggers deliberately after reviewing exactly this kind of draft.
 *
 * Same bearer gate as the other ops endpoints (/api/ingest/*).
 */
export const dynamic = "force-dynamic"
export const maxDuration = 60

type Item = {
  contactId?: string
  /** Patched onto the fetched row (or used standalone with no contactId) —
   *  how two contacts that are really the same company (e.g. after an
   *  acquisition) get combined into one ask without a DB write. */
  overrides?: Partial<OutreachContact>
  stageId?: string
}

export async function POST(request: Request) {
  const auth = requireIngestSecret(request)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
  }

  const body = (await request.json().catch(() => null)) as { items?: Item[] } | null
  if (!body?.items?.length) {
    return NextResponse.json({ data: null, error: "items is required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const drafts: Array<{
    companyName: string
    to?: string
    subject?: string
    body?: string
    error?: string
  }> = []

  for (const item of body.items) {
    let contact: OutreachContact

    if (item.contactId) {
      const { data, error } = await supabase
        .from("outreach_contacts")
        .select("*")
        .eq("id", item.contactId)
        .maybeSingle()

      if (error || !data) {
        drafts.push({ companyName: item.contactId, error: "contact not found" })
        continue
      }
      contact = { ...(data as OutreachContact), ...item.overrides }
    } else if (item.overrides?.company_name) {
      contact = {
        id: "00000000-0000-0000-0000-000000000000",
        status: "pending",
        created_at: new Date().toISOString(),
        ...item.overrides,
        company_name: item.overrides.company_name,
      }
    } else {
      drafts.push({ companyName: "(unknown)", error: "contactId or overrides.company_name required" })
      continue
    }

    try {
      const email = await generateOutreachEmail(contact, item.stageId ?? "first_contact")
      drafts.push({
        companyName: contact.company_name,
        to: contact.contact_email,
        subject: email.subject,
        body: email.body,
      })
    } catch (error) {
      drafts.push({
        companyName: contact.company_name,
        to: contact.contact_email,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return NextResponse.json({ data: { drafts }, error: null })
}
