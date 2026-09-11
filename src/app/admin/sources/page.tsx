import { setSourceStatus, upsertSource } from "@/app/admin/actions"
import { Badge, DataTable } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { getAdminSources } from "@/lib/admin/queries"
import { formatDateTime } from "@/lib/format"

const INTEGRATION_TYPES = [
  "api",
  "rss",
  "xml",
  "csv",
  "manual",
  "ftp",
  "email",
  "google_sheets",
] as const

const statusTones = {
  active: "success",
  pending: "warning",
  inactive: "neutral",
} as const

const fieldClass =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export default async function AdminSourcesPage() {
  const sources = await getAdminSources()

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Auction sources</h1>
        <p className="text-sm text-muted-foreground">
          {sources.length} sources · listing counts are live and active-only.
        </p>
      </div>

      <DataTable
        rows={sources}
        getRowKey={(row) => row.id}
        empty="No sources yet. Add the first one below."
        columns={[
          {
            key: "name",
            header: "Source",
            cell: (row) => (
              <div className="flex min-w-48 flex-col gap-0.5">
                <span className="font-medium text-foreground">{row.name}</span>
                <a
                  href={row.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  {row.website_url.replace(/^https?:\/\//, "")}
                </a>
              </div>
            ),
          },
          {
            key: "integration",
            header: "Integration",
            cell: (row) => (
              <span className="font-mono text-xs text-muted-foreground">
                {row.integration_type}
              </span>
            ),
          },
          {
            key: "coverage",
            header: "Coverage",
            cell: (row) => (
              <span className="text-muted-foreground">{row.geographic_coverage ?? "—"}</span>
            ),
          },
          {
            key: "listings",
            header: "Live listings",
            align: "right",
            cell: (row) => <span className="tabular-nums">{row.listingCount.toLocaleString()}</span>,
          },
          {
            key: "synced",
            header: "Last synced",
            cell: (row) => (
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDateTime(row.last_synced_at) ?? "Never"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <div className="flex items-center gap-1.5">
                <Badge tone={statusTones[row.status]}>{row.status}</Badge>
                {row.is_featured && <Badge tone="success">Featured</Badge>}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (row) => (
              <form action={setSourceStatus}>
                <input type="hidden" name="id" value={row.id} />
                <input
                  type="hidden"
                  name="status"
                  value={row.status === "active" ? "inactive" : "active"}
                />
                <Button type="submit" size="xs" variant="outline">
                  {row.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </form>
            ),
          },
        ]}
      />

      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold text-foreground">Add a source</h2>
        <form action={upsertSource} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <input name="name" required className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Website URL</span>
            <input name="website_url" type="url" required placeholder="https://" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Logo URL</span>
            <input name="logo_url" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Geographic coverage</span>
            <input name="geographic_coverage" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Integration type</span>
            <select name="integration_type" defaultValue="manual" className={fieldClass}>
              {INTEGRATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Feed / API endpoint</span>
            <input name="api_endpoint" className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <textarea name="description" rows={2} className={`${fieldClass} h-auto py-2`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <select name="status" defaultValue="pending" className={fieldClass}>
              <option value="pending">pending</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_featured" className="size-4" /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_sponsored" className="size-4" /> Sponsored
            </label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="lg">
              Save source
            </Button>
          </div>
        </form>
      </section>
    </>
  )
}
