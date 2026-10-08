import { setSourceStatus, upsertSource } from "@/app/admin/actions"
import { Badge, DataTable } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { getAdminSources } from "@/lib/admin/queries"
import { formatDateTime } from "@/lib/format"
import type { AuctionSource } from "@/types"

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

const syncTones = {
  success: "success",
  partial: "warning",
  failed: "danger",
  running: "neutral",
} as const

/** Add and edit share one form; with a source it edits that row in place. */
function SourceForm({ source }: { source?: AuctionSource }) {
  return (
    <form action={upsertSource} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {source && <input type="hidden" name="id" value={source.id} />}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Name</span>
        <input name="name" required defaultValue={source?.name} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Website URL</span>
        <input
          name="website_url"
          type="url"
          required
          defaultValue={source?.website_url}
          placeholder="https://"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Logo URL</span>
        <input name="logo_url" defaultValue={source?.logo_url} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Geographic coverage</span>
        <input
          name="geographic_coverage"
          defaultValue={source?.geographic_coverage}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Integration type</span>
        <select
          name="integration_type"
          defaultValue={source?.integration_type ?? "manual"}
          className={fieldClass}
        >
          {INTEGRATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Feed / API endpoint</span>
        <input name="api_endpoint" defaultValue={source?.api_endpoint} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-medium text-muted-foreground">Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={source?.description}
          className={`${fieldClass} h-auto py-2`}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <select name="status" defaultValue={source?.status ?? "pending"} className={fieldClass}>
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
      <div className="flex items-end gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={source?.is_featured}
            className="size-4"
          />{" "}
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_sponsored"
            defaultChecked={source?.is_sponsored}
            className="size-4"
          />{" "}
          Sponsored
        </label>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg">
          Save source
        </Button>
      </div>
    </form>
  )
}

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
            header: "Feed status",
            cell: (row) => (
              <div className="flex max-w-56 flex-col gap-1 text-xs">
                <span className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(row.last_synced_at) ?? "Never synced"}
                </span>
                <div className="flex flex-wrap gap-1">
                  {row.last_sync_status && (
                    <Badge tone={syncTones[row.last_sync_status]}>{row.last_sync_status}</Badge>
                  )}
                  <Badge tone={row.sync_enabled ? "success" : "neutral"}>
                    {row.sync_enabled ? "auto-sync on" : "auto-sync off"}
                  </Badge>
                </div>
                {row.last_sync_error && (
                  <span className="text-muted-foreground" title={row.last_sync_error}>
                    {row.last_sync_error}
                  </span>
                )}
              </div>
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
              <div className="flex flex-col items-end gap-1.5">
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
                <details className="text-left">
                  <summary className="cursor-pointer text-right text-xs text-primary hover:underline">
                    Edit
                  </summary>
                  <div className="mt-2 w-[min(36rem,80vw)] rounded-lg border border-border bg-background p-3">
                    <SourceForm source={row} />
                  </div>
                </details>
              </div>
            ),
          },
        ]}
      />

      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold text-foreground">Add a source</h2>
        <SourceForm />
      </section>
    </>
  )
}
