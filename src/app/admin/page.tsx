import {
  Building2,
  Handshake,
  Megaphone,
  MousePointerClick,
  Tractor,
  Users,
} from "lucide-react"
import Link from "next/link"

import { DataTable } from "@/components/admin/data-table"
import { StatsCard } from "@/components/admin/stats-card"
import { getAdminStats, getClicksBySource } from "@/lib/admin/queries"

export default async function AdminDashboardPage() {
  const [stats, clicksBySource] = await Promise.all([
    getAdminStats(),
    getClicksBySource(30),
  ])

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform health at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          icon={Tractor}
          label="Active listings"
          value={stats.activeListings}
          hint={`${stats.totalListings.toLocaleString()} total, all statuses`}
        />
        <StatsCard
          icon={Building2}
          label="Active sources"
          value={stats.activeSources}
          hint={`${stats.pendingSources} pending activation`}
        />
        <StatsCard
          icon={MousePointerClick}
          label="Clicks today"
          value={stats.clicksToday}
          hint={`${stats.clicksAllTime.toLocaleString()} outbound clicks all time`}
        />
        <StatsCard
          icon={Users}
          label="Registered users"
          value={stats.totalUsers}
          hint={`${stats.newUsersThisWeek} joined in the last 7 days`}
        />
        <StatsCard
          icon={Handshake}
          label="Partners awaiting review"
          value={stats.pendingPartners}
          hint="Applications from the Partner Center"
        />
        <StatsCard
          icon={Megaphone}
          label="Outreach not yet contacted"
          value={stats.outreachPending}
          hint={`${stats.outreachIntegrated} integrated so far`}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Outbound clicks by source
          </h2>
          <span className="text-xs text-muted-foreground">Last 30 days</span>
        </div>
        <DataTable
          rows={clicksBySource}
          getRowKey={(row) => row.sourceId}
          empty="No outbound clicks recorded yet."
          columns={[
            {
              key: "name",
              header: "Source",
              cell: (row) => <span className="font-medium">{row.name}</span>,
            },
            {
              key: "clicks",
              header: "Clicks",
              align: "right",
              cell: (row) => <span className="tabular-nums">{row.clicks.toLocaleString()}</span>,
            },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          This is the traffic figure to show partners.{" "}
          <Link href="/admin/sponsored" className="text-primary hover:underline">
            Sponsored placements
          </Link>{" "}
          tracks paid performance separately.
        </p>
      </section>
    </>
  )
}
