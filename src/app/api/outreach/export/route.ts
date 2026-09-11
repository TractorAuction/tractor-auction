import { NextResponse } from "next/server"

import { getOutreachContacts } from "@/lib/admin/queries"
import { requireAdmin } from "@/lib/auth/require-admin"

const COLUMNS = [
  "company_name",
  "website_url",
  "contact_name",
  "contact_email",
  "contact_phone",
  "geographic_coverage",
  "inventory_type",
  "existing_api_info",
  "status",
  "outreach_date",
  "follow_up_date",
  "response_date",
  "notes",
] as const

/** RFC 4180: quote everything, double any embedded quote. */
function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export async function GET() {
  try {
    await requireAdmin()
  } catch (error) {
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 403 }
    )
  }

  const contacts = await getOutreachContacts()

  const rows = [
    COLUMNS.join(","),
    ...contacts.map((contact) =>
      COLUMNS.map((column) => csvCell(contact[column as keyof typeof contact])).join(",")
    ),
  ]

  const filename = `outreach-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
