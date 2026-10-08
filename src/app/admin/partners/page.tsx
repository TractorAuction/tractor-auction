import {
  approvePartnerAsSource,
  approvePartnerSubmission,
  rejectPartnerSubmission,
  setPartnerStatus,
} from "@/app/admin/actions"
import { Badge, DataTable } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { getPartners, type Partner } from "@/lib/admin/queries"
import { formatCurrency, formatDate, formatLocation } from "@/lib/format"
import { createAdminClient } from "@/lib/supabase/admin"

const statusTones = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "neutral",
} as const

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key]
  const single = Array.isArray(raw) ? raw[0] : raw
  return single?.trim() || undefined
}

export default async function AdminPartnersPage(props: PageProps<"/admin/partners">) {
  const params = await props.searchParams
  const status = value(params, "status")
  const [partners, { data: submissionRows }] = await Promise.all([
    getPartners(status),
    createAdminClient()
      .from("partner_submissions")
      .select("*, partner:partners(company_name, source_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ])
  const submissions = (submissionRows ?? []) as Array<Record<string, unknown>>

  const fieldClass =
    "h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Partners</h1>
        <p className="text-sm text-muted-foreground">
          {partners.length} applications in this view. Approving one creates the auction
          source their listings will sync into.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2">
        <select name="status" defaultValue={status ?? ""} className={fieldClass}>
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="suspended">suspended</option>
        </select>
        <Button type="submit" size="lg">
          Filter
        </Button>
      </form>

      <DataTable<Partner>
        rows={partners}
        getRowKey={(row) => row.id}
        empty="No partner applications yet. The form at /partner/register feeds this queue."
        columns={[
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
                <span className="text-xs text-muted-foreground">
                  Applied {formatDate(row.created_at)}
                </span>
              </div>
            ),
          },
          {
            key: "contact",
            header: "Contact",
            cell: (row) => (
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="text-foreground">{row.contact_name ?? "—"}</span>
                <a href={`mailto:${row.contact_email}`} className="text-primary hover:underline">
                  {row.contact_email}
                </a>
                {row.contact_phone && (
                  <span className="text-muted-foreground">{row.contact_phone}</span>
                )}
              </div>
            ),
          },
          {
            key: "inventory",
            header: "Inventory",
            cell: (row) => (
              <div className="flex max-w-48 flex-col gap-0.5 text-xs text-muted-foreground">
                <span>{row.inventory_type ?? "—"}</span>
                <span>{row.geographic_coverage ?? "—"}</span>
                {row.listings_per_month && <span>{row.listings_per_month} / month</span>}
              </div>
            ),
          },
          {
            key: "feed",
            header: "Feed",
            cell: (row) => (
              <div className="flex max-w-48 flex-col gap-0.5 text-xs">
                <span className="font-mono text-muted-foreground">{row.feed_type ?? "—"}</span>
                {row.feed_url && (
                  <span className="truncate text-muted-foreground" title={row.feed_url}>
                    {row.feed_url}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <div className="flex flex-col gap-1">
                <Badge tone={statusTones[row.status]}>{row.status}</Badge>
                {row.source_id && <Badge tone="success">Source created</Badge>}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (row) => (
              <div className="flex flex-col items-end gap-1.5">
                {row.status !== "approved" && (
                  <form action={approvePartnerAsSource}>
                    <input type="hidden" name="id" value={row.id} />
                    <Button type="submit" size="xs">
                      Approve
                    </Button>
                  </form>
                )}
                {row.status !== "rejected" && (
                  <form action={setPartnerStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <Button type="submit" size="xs" variant="outline">
                      Reject
                    </Button>
                  </form>
                )}
                {row.status !== "pending" && (
                  <form action={setPartnerStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="status" value="pending" />
                    <Button type="submit" size="xs" variant="ghost">
                      Mark pending
                    </Button>
                  </form>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Listings typed in by approved partners. Nothing here is public until
          approved, which publishes it under the partner's auction source. */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Listing submissions</h2>
          <p className="text-sm text-muted-foreground">
            {submissions.length === 0
              ? "No listings waiting for review."
              : `${submissions.length} waiting for review. Check the auction link before approving.`}
          </p>
        </div>
        {submissions.map((submission) => {
          const partner = submission.partner as Record<string, unknown> | null
          return (
            <div
              key={submission.id as string}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex min-w-60 flex-1 flex-col gap-1 text-sm">
                <span className="font-medium text-foreground">{submission.title as string}</span>
                <span className="text-xs text-muted-foreground">
                  {[
                    partner?.company_name as string,
                    submission.equipment_category as string,
                    [submission.year, submission.make, submission.model].filter(Boolean).join(" "),
                    submission.hours ? `${Number(submission.hours).toLocaleString()} hrs` : null,
                    formatLocation(
                      submission.location_city as string | null,
                      submission.location_state as string | null
                    ),
                    formatCurrency(submission.current_bid as number | null),
                    submission.auction_end_date
                      ? `ends ${formatDate(submission.auction_end_date as string)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <a
                  href={submission.original_url as string}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="w-fit truncate text-xs text-primary hover:underline"
                >
                  {submission.original_url as string}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <form action={approvePartnerSubmission}>
                  <input type="hidden" name="id" value={submission.id as string} />
                  <Button type="submit" size="xs" disabled={!partner?.source_id}>
                    Approve &amp; publish
                  </Button>
                </form>
                <form action={rejectPartnerSubmission}>
                  <input type="hidden" name="id" value={submission.id as string} />
                  <Button type="submit" size="xs" variant="outline">
                    Reject
                  </Button>
                </form>
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}
