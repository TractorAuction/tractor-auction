import { createPlacement, setPlacementActive } from "@/app/admin/actions"
import { Badge, DataTable } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import {
  getAdminListings,
  getAdminSources,
  getSponsoredPlacements,
  type SponsoredPlacement,
} from "@/lib/admin/queries"
import { formatDate } from "@/lib/format"

const PLACEMENT_TYPES = [
  { value: "featured_listing", label: "Featured listing (top of search)" },
  { value: "sponsored_listing", label: "Sponsored listing (promoted strip)" },
  { value: "featured_source", label: "Featured source (search sidebar)" },
  { value: "homepage", label: "Homepage slot" },
  { value: "category_sponsor", label: "Category sponsor" },
  { value: "banner", label: "Banner" },
] as const

const fieldClass =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export default async function AdminSponsoredPage() {
  const [placements, sources, { listings }] = await Promise.all([
    getSponsoredPlacements(),
    getAdminSources(),
    getAdminListings({ status: "active" }),
  ])

  const totalImpressions = placements.reduce((sum, row) => sum + row.impressions, 0)
  const totalClicks = placements.reduce((sum, row) => sum + row.clicks, 0)

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sponsored placements</h1>
        <p className="text-sm text-muted-foreground">
          {placements.length} placements · {totalImpressions.toLocaleString()} impressions ·{" "}
          {totalClicks.toLocaleString()} clicks
        </p>
      </div>

      <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Promoted listings render in their own labelled strip above organic results and are
        excluded from the organic set, so paid and unpaid placement are never mixed. Every
        promoted card carries a visible “Sponsored” label.
      </p>

      <DataTable<SponsoredPlacement>
        rows={placements}
        getRowKey={(row) => row.id}
        empty="No placements sold yet. Create one below to see it appear on the site."
        columns={[
          {
            key: "target",
            header: "Placement",
            cell: (row) => (
              <div className="flex min-w-48 flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {row.listing_title ?? row.source_name ?? "—"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {row.placement_type}
                </span>
              </div>
            ),
          },
          {
            key: "runs",
            header: "Runs",
            cell: (row) => (
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(row.start_date) ?? "Immediately"} →{" "}
                {formatDate(row.end_date) ?? "No end date"}
              </span>
            ),
          },
          {
            key: "impressions",
            header: "Impressions",
            align: "right",
            cell: (row) => <span className="tabular-nums">{row.impressions.toLocaleString()}</span>,
          },
          {
            key: "clicks",
            header: "Clicks",
            align: "right",
            cell: (row) => <span className="tabular-nums">{row.clicks.toLocaleString()}</span>,
          },
          {
            key: "ctr",
            header: "CTR",
            align: "right",
            cell: (row) => (
              <span className="tabular-nums text-muted-foreground">
                {row.impressions > 0
                  ? `${((row.clicks / row.impressions) * 100).toFixed(1)}%`
                  : "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <Badge tone={row.is_active ? "success" : "neutral"}>
                {row.is_active ? "active" : "paused"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (row) => (
              <form action={setPlacementActive}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="next" value={String(!row.is_active)} />
                <Button type="submit" size="xs" variant="outline">
                  {row.is_active ? "Pause" : "Activate"}
                </Button>
              </form>
            ),
          },
        ]}
      />

      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold text-foreground">Create a placement</h2>
        <p className="text-xs text-muted-foreground">
          Pick a listing or a source, not both. Listing placements also switch that
          listing&apos;s “Sponsored” label on.
        </p>
        <form action={createPlacement} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Placement type</span>
            <select name="placement_type" defaultValue="sponsored_listing" className={fieldClass}>
              {PLACEMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Listing</span>
            <select name="listing_id" defaultValue="" className={fieldClass}>
              <option value="">No listing</option>
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title ?? listing.id}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Source</span>
            <select name="source_id" defaultValue="" className={fieldClass}>
              <option value="">No source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Start</span>
              <input name="start_date" type="date" className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">End</span>
              <input name="end_date" type="date" className={fieldClass} />
            </label>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" size="lg">
              Create placement
            </Button>
          </div>
        </form>
      </section>
    </>
  )
}
