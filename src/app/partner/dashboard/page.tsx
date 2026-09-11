import { Lock } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Partner Dashboard — TractorAuction.com",
  robots: { index: false, follow: false },
}

export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Sign-in lands with auth (Day 3). Until then there is no session to read, so
  // the portal shows what it will contain rather than pretending to be logged in.
  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <Lock className="size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Partner sign-in required</h1>
        <p className="text-sm text-muted-foreground">
          Partner accounts open once sign-in is live. If you have already applied, we will
          email you when your dashboard is ready.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/partner" />}>
            About partnering
          </Button>
          <Button nativeButton={false} render={<Link href="/partner/register" />}>
            Apply
          </Button>
        </div>
      </main>
    )
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!partner) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">No partner account yet</h1>
        <p className="text-sm text-muted-foreground">
          This account is not linked to a partner application.
        </p>
        <Button nativeButton={false} render={<Link href="/partner/register" />}>
          Apply to become a partner
        </Button>
      </main>
    )
  }

  const record = partner as Record<string, unknown>
  const { count: liveListings } = record.source_id
    ? await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("source_id", record.source_id as string)
        .eq("status", "active")
    : { count: 0 }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {record.company_name as string}
        </h1>
        <p className="text-sm text-muted-foreground">
          Application status: {record.status as string}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Live listings</dt>
          <dd className="text-2xl font-semibold tabular-nums">{liveListings ?? 0}</dd>
        </div>
        <div className="rounded-lg border border-border p-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Feed type</dt>
          <dd className="text-sm">{(record.feed_type as string) ?? "Not set"}</dd>
        </div>
        <div className="rounded-lg border border-border p-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Coverage</dt>
          <dd className="text-sm">{(record.geographic_coverage as string) ?? "—"}</dd>
        </div>
      </dl>

      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-foreground">Your feed</h2>
        <p className="text-sm text-muted-foreground">
          {(record.feed_url as string) ??
            "No feed URL on file. Send us one and your listings sync automatically."}
        </p>
      </section>
    </main>
  )
}
