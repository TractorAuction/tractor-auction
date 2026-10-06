import { BarChart3, MousePointerClick, Star, UserPlus } from "lucide-react"
import type { Metadata } from "next"

import { Badge, DataTable } from "@/components/admin/data-table"
import { DailyBars } from "@/components/admin/daily-bars"
import {
  getClicksBySource,
  getClicksOverTime,
  getPlacementPerformance,
  getPopularMakes,
  getSignupsOverTime,
} from "@/lib/admin/queries"

export const metadata: Metadata = { title: "Analytics — Admin — TractorAuction.com" }

const WINDOW_DAYS = 30

function sum(series: { count: number }[]) {
  return series.reduce((total, point) => total + point.count, 0)
}

export default async function AdminAnalyticsPage() {
  const [clicksOverTime, signupsOverTime, clicksBySource, popularMakes, placements] =
    await Promise.all([
      getClicksOverTime(WINDOW_DAYS),
      getSignupsOverTime(WINDOW_DAYS),
      getClicksBySource(WINDOW_DAYS),
      getPopularMakes(10),
      getPlacementPerformance(),
    ])

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Last {WINDOW_DAYS} days, unless a section says otherwise.
        </p>
      </div>

      {/* Search volume and listing-detail page views have no event table yet
          — neither is instrumented anywhere in the app — so this page only
          ever shows what's actually tracked rather than a blank or fabricated
          "0" for something nobody measured. */}
      <div className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
        Not shown here yet: search volume and listing page views. Neither has an event
        table in the schema — both need their own tracking added before they can report
        anything honestly.
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MousePointerClick className="size-4 text-muted-foreground" />
              Outbound clicks
            </h2>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {sum(clicksOverTime).toLocaleString()}
            </span>
          </div>
          <DailyBars series={clicksOverTime} label="clicks" />
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserPlus className="size-4 text-muted-foreground" />
              New registrations
            </h2>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {sum(signupsOverTime).toLocaleString()}
            </span>
          </div>
          <DailyBars series={signupsOverTime} label="signups" />
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <BarChart3 className="size-4 text-muted-foreground" />
          Partner traffic — clicks by source
        </h2>
        <DataTable
          rows={clicksBySource}
          getRowKey={(row) => row.sourceId}
          empty="No outbound clicks recorded yet."
          columns={[
            { key: "name", header: "Source", cell: (row) => row.name },
            {
              key: "clicks",
              header: "Clicks",
              align: "right",
              cell: (row) => row.clicks.toLocaleString(),
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Popular makes</h2>
        <p className="text-xs text-muted-foreground">
          Ranked by active listing count; clicks are all-time outbound clicks for that
          make&apos;s listings.
        </p>
        <DataTable
          rows={popularMakes}
          getRowKey={(row) => row.make}
          empty="No active listings yet."
          columns={[
            { key: "make", header: "Make", cell: (row) => row.make },
            {
              key: "listings",
              header: "Active listings",
              align: "right",
              cell: (row) => row.activeListings.toLocaleString(),
            },
            {
              key: "clicks",
              header: `Clicks (${WINDOW_DAYS}d)`,
              align: "right",
              cell: (row) => row.clicks.toLocaleString(),
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Star className="size-4 text-muted-foreground" />
          Featured &amp; sponsored placement performance
        </h2>
        <DataTable
          rows={placements}
          getRowKey={(row) => row.id}
          empty="No sponsored placements have been created yet."
          columns={[
            {
              key: "label",
              header: "Placement",
              cell: (row) => (
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{row.label}</span>
                  <span className="text-xs text-muted-foreground">{row.placementType}</span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) =>
                row.isActive ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="neutral">Inactive</Badge>
                ),
            },
            {
              key: "impressions",
              header: "Impressions",
              align: "right",
              cell: (row) => row.impressions.toLocaleString(),
            },
            {
              key: "clicks",
              header: "Clicks",
              align: "right",
              cell: (row) => row.clicks.toLocaleString(),
            },
            {
              key: "ctr",
              header: "CTR",
              align: "right",
              cell: (row) => (row.ctr === null ? "—" : `${(row.ctr * 100).toFixed(1)}%`),
            },
          ]}
        />
      </section>
    </>
  )
}
