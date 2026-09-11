import { Download } from "lucide-react"
import Link from "next/link"

import { setOutreachStatus, updateOutreachContact } from "@/app/admin/actions"
import { Badge, DataTable } from "@/components/admin/data-table"
import { OutreachComposer } from "@/components/admin/outreach-composer"
import { Button } from "@/components/ui/button"
import { getOutreachContacts } from "@/lib/admin/queries"
import { formatDate } from "@/lib/format"
import type { OutreachContact } from "@/types"

const STATUSES: OutreachContact["status"][] = [
  "pending",
  "contacted",
  "follow_up",
  "responded",
  "api_requested",
  "api_received",
  "integration_pending",
  "integrated",
  "declined",
  "no_response",
]

const statusTones: Record<OutreachContact["status"], "neutral" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  contacted: "warning",
  follow_up: "warning",
  responded: "success",
  api_requested: "warning",
  api_received: "success",
  integration_pending: "warning",
  integrated: "success",
  declined: "danger",
  no_response: "neutral",
}

/** Mirrors the tiers in OUTREACH_SOURCES.md. */
const TIERS = [
  { tier: 1, label: "Large platforms" },
  { tier: 2, label: "Farm auction companies" },
  { tier: 3, label: "Regional auctioneers" },
  { tier: 4, label: "Government / municipal" },
  { tier: 5, label: "Software providers" },
  { tier: 6, label: "Marketplaces" },
  { tier: 7, label: "International (Phase 2)" },
]

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key]
  const single = Array.isArray(raw) ? raw[0] : raw
  return single?.trim() || undefined
}

export default async function AdminOutreachPage(props: PageProps<"/admin/outreach">) {
  const params = await props.searchParams
  const status = value(params, "status")
  const due = value(params, "due") === "1"
  const tier = Number(value(params, "tier")) || undefined

  const contacts = await getOutreachContacts({ status, due, tier })
  const missingEmail = contacts.filter((contact) => !contact.contact_email).length

  const fieldClass =
    "h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Outreach</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} companies in this view, ordered by tier. Work Tier 1 first.
          </p>
        </div>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/api/outreach/export" prefetch={false} />}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {missingEmail > 0 && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          {missingEmail} companies have no contact address yet. Add one from the company&apos;s
          own contact page before sending — the seed deliberately ships these blank rather
          than guessing an address.
        </p>
      )}

      <form className="flex flex-wrap items-center gap-2">
        <select name="status" defaultValue={status ?? ""} className={fieldClass}>
          <option value="">All statuses</option>
          {STATUSES.map((option) => (
            <option key={option} value={option}>
              {option.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select name="tier" defaultValue={tier ? String(tier) : ""} className={fieldClass}>
          <option value="">All tiers</option>
          {TIERS.map((entry) => (
            <option key={entry.tier} value={entry.tier}>
              Tier {entry.tier} — {entry.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="due" value="1" defaultChecked={due} className="size-4" />
          Follow-up due
        </label>
        <Button type="submit" size="lg">
          Filter
        </Button>
      </form>

      <DataTable<OutreachContact>
        rows={contacts}
        getRowKey={(row) => row.id}
        empty="No companies match this filter."
        columns={[
          {
            key: "tier",
            header: "Tier",
            cell: (row) =>
              row.tier ? (
                <Badge tone={row.tier <= 1 ? "success" : row.tier <= 3 ? "warning" : "neutral"}>
                  {row.tier}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
          {
            key: "company",
            header: "Company",
            cell: (row) => (
              <div className="flex min-w-48 flex-col gap-0.5">
                <span className="font-medium text-foreground">{row.company_name}</span>
                {row.website_url && (
                  <a
                    href={row.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    {row.website_url.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {row.geographic_coverage && (
                  <span className="text-xs text-muted-foreground">{row.geographic_coverage}</span>
                )}
                {row.integration_request && (
                  <span className="text-xs text-muted-foreground">
                    Ask: {row.integration_request}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "details",
            header: "Contact & notes",
            cell: (row) => (
              // Inline editing keeps research in one place — no separate edit screen.
              <form action={updateOutreachContact} className="flex min-w-56 flex-col gap-1.5">
                <input type="hidden" name="id" value={row.id} />
                <input
                  name="contact_name"
                  defaultValue={row.contact_name ?? ""}
                  placeholder="Contact name"
                  className="h-7 rounded border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring"
                />
                <input
                  name="contact_email"
                  type="email"
                  defaultValue={row.contact_email ?? ""}
                  placeholder="Email"
                  className="h-7 rounded border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring"
                />
                <input
                  name="integration_request"
                  defaultValue={row.integration_request ?? ""}
                  placeholder="Integration to request"
                  className="h-7 rounded border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring"
                />
                <input
                  name="follow_up_date"
                  type="date"
                  defaultValue={row.follow_up_date?.slice(0, 10) ?? ""}
                  className="h-7 rounded border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring"
                />
                <textarea
                  name="notes"
                  defaultValue={row.notes ?? ""}
                  rows={2}
                  placeholder="Notes"
                  className="rounded border border-border bg-background px-2 py-1 text-xs outline-none focus-visible:border-ring"
                />
                <Button type="submit" size="xs" variant="outline">
                  Save
                </Button>
              </form>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <form action={setOutreachStatus} className="flex flex-col gap-1.5">
                <input type="hidden" name="id" value={row.id} />
                <Badge tone={statusTones[row.status]}>{row.status.replace(/_/g, " ")}</Badge>
                <select
                  name="status"
                  defaultValue={row.status}
                  className="h-7 rounded border border-border bg-background px-1.5 text-xs outline-none focus-visible:border-ring"
                >
                  {STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="xs" variant="outline">
                  Update
                </Button>
                {row.outreach_date && (
                  <span className="text-[11px] text-muted-foreground">
                    Sent {formatDate(row.outreach_date)}
                  </span>
                )}
                {row.follow_up_date && (
                  <span className="text-[11px] text-muted-foreground">
                    Follow up {formatDate(row.follow_up_date)}
                  </span>
                )}
              </form>
            ),
          },
          {
            key: "compose",
            header: "Email",
            cell: (row) => <OutreachComposer contact={row} />,
          },
        ]}
      />
    </>
  )
}
