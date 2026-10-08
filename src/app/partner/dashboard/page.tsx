import { Lock } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { submitPartnerListing } from "@/app/partner/actions"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import { getCurrentPartner } from "@/lib/partners/current"
import { EQUIPMENT_CATEGORIES, US_STATES } from "@/lib/seo/slug"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = {
  title: "Partner Dashboard — TractorAuction.com",
  robots: { index: false, follow: false },
}

const fieldClass =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const LISTING_ERRORS: Record<string, string> = {
  missing: "A title and a link to the listing on your site are required.",
  failed: "Something went wrong saving that listing. Please try again.",
  not_approved: "Listings can be submitted once your partner application is approved.",
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

/**
 * Outbound clicks to this partner's listings: the number that shows what the
 * partnership is worth to them. Read with the service role because click
 * events are private, but always scoped to the signed-in partner's source.
 */
async function getPartnerClicks(sourceId: string) {
  const admin = createAdminClient()
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [{ count: total }, { data: recent }] = await Promise.all([
    admin.from("click_events").select("id", { count: "exact", head: true }).eq("source_id", sourceId),
    admin
      .from("click_events")
      .select("listing_id, listing:listings(id, title)")
      .eq("source_id", sourceId)
      .gte("clicked_at", since30)
      .limit(10_000),
  ])

  const byListing = new Map<string, { title: string; clicks: number }>()
  for (const row of (recent ?? []) as Array<Record<string, unknown>>) {
    const listing = row.listing as Record<string, unknown> | null
    const id = row.listing_id as string | null
    if (!id) continue
    const entry = byListing.get(id) ?? { title: (listing?.title as string) ?? "Listing", clicks: 0 }
    entry.clicks += 1
    byListing.set(id, entry)
  }

  return {
    total: total ?? 0,
    last30: recent?.length ?? 0,
    top: [...byListing.entries()]
      .map(([id, entry]) => ({ id, ...entry }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10),
  }
}

export default async function PartnerDashboardPage(props: PageProps<"/partner/dashboard">) {
  const params = await props.searchParams
  const listingError = LISTING_ERRORS[first(params.listing_error) ?? ""]
  const listingSubmitted = first(params.listing_submitted) === "1"

  const { user, partner } = await getCurrentPartner()

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <Lock className="size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Partner sign-in required</h1>
        <p className="text-sm text-muted-foreground">
          Log in with the email address on your partner application to see your dashboard.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/login?next=/partner/dashboard" />}
          >
            Log in
          </Button>
          <Button nativeButton={false} render={<Link href="/partner/register" />}>
            Apply
          </Button>
        </div>
      </main>
    )
  }

  if (!partner) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">No partner account yet</h1>
        <p className="text-sm text-muted-foreground">
          No partner application uses {user.email}. Apply with this address, or log in with
          the email you applied with.
        </p>
        <Button nativeButton={false} render={<Link href="/partner/register" />}>
          Apply to become a partner
        </Button>
      </main>
    )
  }

  const admin = createAdminClient()
  const [liveResult, submissionsResult, clicks] = await Promise.all([
    partner.source_id
      ? admin
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("source_id", partner.source_id)
          .eq("status", "active")
      : Promise.resolve({ count: 0 }),
    admin
      .from("partner_submissions")
      .select("id, title, status, created_at, listing_id")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false })
      .limit(50),
    partner.source_id ? getPartnerClicks(partner.source_id) : Promise.resolve(null),
  ])
  const submissions = (submissionsResult.data ?? []) as Array<Record<string, unknown>>
  const approved = partner.status === "approved" && Boolean(partner.source_id)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{partner.company_name}</h1>
        <p className="text-sm text-muted-foreground">
          {partner.status === "approved"
            ? "Approved partner"
            : partner.status === "pending"
              ? "Application under review. We will email you once it is approved."
              : `Application ${partner.status}`}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Live listings</dt>
          <dd className="text-2xl font-semibold tabular-nums">{liveResult.count ?? 0}</dd>
        </div>
        <div className="rounded-lg border border-border p-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Clicks, 30 days</dt>
          <dd className="text-2xl font-semibold tabular-nums">{clicks?.last30 ?? 0}</dd>
        </div>
        <div className="rounded-lg border border-border p-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Clicks, all time</dt>
          <dd className="text-2xl font-semibold tabular-nums">{clicks?.total ?? 0}</dd>
        </div>
        <div className="rounded-lg border border-border p-4">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Feed type</dt>
          <dd className="text-sm">{partner.feed_type ?? "Not set"}</dd>
        </div>
      </dl>

      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-foreground">Buyers sent to you</h2>
        <p className="text-xs text-muted-foreground">
          Each click is a buyer leaving TractorAuction.com for your listing page.
        </p>
        {clicks && clicks.top.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {clicks.top.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-2">
                <Link href={`/listing/${row.id}`} className="truncate hover:text-primary hover:underline">
                  {row.title}
                </Link>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.clicks} {row.clicks === 1 ? "click" : "clicks"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No clicks in the last 30 days yet.</p>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-foreground">Your feed</h2>
        <p className="text-sm text-muted-foreground">
          {partner.feed_url ??
            "No feed URL on file. Email partnerships@tractorauction.com with one and your listings sync automatically, or add listings one at a time below."}
        </p>
      </section>

      <section id="submit-listing" className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div>
          <h2 className="font-semibold text-foreground">Add a listing</h2>
          <p className="text-xs text-muted-foreground">
            For auctions not in a feed. We review each one before it goes live; buyers who
            click it are sent to the link you give.
          </p>
        </div>

        {listingSubmitted && (
          <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
            Listing received. It goes live once we have reviewed it.
          </p>
        )}
        {listingError && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {listingError}
          </p>
        )}

        {approved ? (
          <form action={submitPartnerListing} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Title *">
                <input name="title" required maxLength={200} placeholder="2015 John Deere 6145R" className={fieldClass} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Link to this listing on your site *">
                <input name="original_url" type="url" required placeholder="https://" className={fieldClass} />
              </Field>
            </div>
            <Field label="Category">
              <select name="equipment_category" defaultValue="" className={fieldClass}>
                <option value="">Detect from title</option>
                {EQUIPMENT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Make">
              <input name="make" placeholder="John Deere" className={fieldClass} />
            </Field>
            <Field label="Model">
              <input name="model" placeholder="6145R" className={fieldClass} />
            </Field>
            <Field label="Year">
              <input name="year" type="number" inputMode="numeric" className={fieldClass} />
            </Field>
            <Field label="Hours">
              <input name="hours" type="number" inputMode="numeric" className={fieldClass} />
            </Field>
            <Field label="Horsepower">
              <input name="horsepower" type="number" inputMode="numeric" className={fieldClass} />
            </Field>
            <Field label="City">
              <input name="location_city" className={fieldClass} />
            </Field>
            <Field label="State">
              <select name="location_state" defaultValue="" className={fieldClass}>
                <option value="">Select</option>
                {Object.entries(US_STATES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Auction ends">
              <input name="auction_end_date" type="datetime-local" className={fieldClass} />
            </Field>
            <Field label="Current bid (USD)">
              <input name="current_bid" type="number" inputMode="decimal" min={0} className={fieldClass} />
            </Field>
            <Field label="Condition">
              <input name="condition" placeholder="Used, runs and drives" className={fieldClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea name="description" rows={4} maxLength={5000} className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Submit for review</Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can add listings here once your application is approved.
          </p>
        )}

        {submissions.length > 0 && (
          <ul className="flex flex-col divide-y divide-border border-t border-border text-sm">
            {submissions.map((submission) => (
              <li key={submission.id as string} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate">
                  {submission.listing_id ? (
                    <Link href={`/listing/${submission.listing_id as string}`} className="hover:text-primary hover:underline">
                      {submission.title as string}
                    </Link>
                  ) : (
                    (submission.title as string)
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {submission.status === "pending"
                    ? "In review"
                    : submission.status === "approved"
                      ? "Live"
                      : "Not accepted"}{" "}
                  · {formatDate(submission.created_at as string)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
