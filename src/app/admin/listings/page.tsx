import Link from "next/link"

import { setListingStatus, toggleListingFlag } from "@/app/admin/actions"
import { Badge, DataTable } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { ADMIN_PAGE_SIZE, getAdminListings, getAdminSources } from "@/lib/admin/queries"
import { formatCurrency, formatDate, formatLocation } from "@/lib/format"
import type { Listing } from "@/types"

const statusTones = {
  active: "success",
  expired: "neutral",
  sold: "warning",
} as const

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key]
  const single = Array.isArray(raw) ? raw[0] : raw
  return single?.trim() || undefined
}

export default async function AdminListingsPage(props: PageProps<"/admin/listings">) {
  const params = await props.searchParams

  const filters = {
    query: value(params, "q"),
    status: value(params, "status"),
    source_id: value(params, "source"),
    page: Number(value(params, "page") ?? 1) || 1,
  }

  const [{ listings, total, page }, sources] = await Promise.all([
    getAdminListings(filters),
    getAdminSources(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE))

  const pageHref = (target: number) => {
    const next = new URLSearchParams()
    if (filters.query) next.set("q", filters.query)
    if (filters.status) next.set("status", filters.status)
    if (filters.source_id) next.set("source", filters.source_id)
    if (target > 1) next.set("page", String(target))
    const query = next.toString()
    return query ? `/admin/listings?${query}` : "/admin/listings"
  }

  const fieldClass =
    "h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Listings</h1>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} listings · page {page} of {totalPages}
          </p>
        </div>
      </div>

      {/* A GET form keeps the filter state in the URL, so it survives a reload. */}
      <form className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={filters.query ?? ""}
          placeholder="Title, make, model, external ID"
          className={`${fieldClass} min-w-56 flex-1`}
        />
        <select name="status" defaultValue={filters.status ?? ""} className={fieldClass}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="sold">Sold</option>
        </select>
        <select name="source" defaultValue={filters.source_id ?? ""} className={fieldClass}>
          <option value="">All sources</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="lg">
          Filter
        </Button>
      </form>

      <DataTable<Listing>
        rows={listings}
        getRowKey={(row) => row.id}
        empty="No listings match these filters."
        columns={[
          {
            key: "title",
            header: "Listing",
            cell: (row) => (
              <div className="flex min-w-56 flex-col gap-0.5">
                <Link
                  href={`/listing/${row.id}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {row.title ?? [row.year, row.make, row.model].filter(Boolean).join(" ")}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {[formatLocation(row.location_city, row.location_state), row.external_id]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            ),
          },
          {
            key: "source",
            header: "Source",
            cell: (row) => (
              <span className="whitespace-nowrap text-muted-foreground">{row.source?.name ?? "—"}</span>
            ),
          },
          {
            key: "bid",
            header: "Current bid",
            align: "right",
            cell: (row) => (
              <span className="tabular-nums">{formatCurrency(row.current_bid) ?? "—"}</span>
            ),
          },
          {
            key: "ends",
            header: "Ends",
            cell: (row) => (
              <span className="whitespace-nowrap text-muted-foreground">
                {formatDate(row.auction_end_date) ?? "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <Badge tone={statusTones[row.status]}>{row.status}</Badge>,
          },
          {
            key: "promotion",
            header: "Promotion",
            cell: (row) => (
              <div className="flex items-center gap-1.5">
                <form action={toggleListingFlag}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="field" value="is_featured" />
                  <input type="hidden" name="next" value={String(!row.is_featured)} />
                  <Button
                    type="submit"
                    size="xs"
                    variant={row.is_featured ? "default" : "outline"}
                  >
                    Featured
                  </Button>
                </form>
                <form action={toggleListingFlag}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="field" value="is_sponsored" />
                  <input type="hidden" name="next" value={String(!row.is_sponsored)} />
                  <Button
                    type="submit"
                    size="xs"
                    variant={row.is_sponsored ? "default" : "outline"}
                  >
                    Sponsored
                  </Button>
                </form>
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (row) => (
              <form action={setListingStatus}>
                <input type="hidden" name="id" value={row.id} />
                <input
                  type="hidden"
                  name="status"
                  value={row.status === "active" ? "expired" : "active"}
                />
                <Button type="submit" size="xs" variant="outline">
                  {row.status === "active" ? "Deactivate" : "Reactivate"}
                </Button>
              </form>
            ),
          },
        ]}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={pageHref(page - 1)} />}>
              Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={pageHref(page + 1)} />}>
              Next
            </Button>
          )}
        </div>
      )}
    </>
  )
}
