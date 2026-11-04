import { BellRing, Download, Search, Send, X } from "lucide-react"
import Link from "next/link"

import { OutreachRow } from "@/components/admin/outreach-row"
import { Button } from "@/components/ui/button"
import { getOutreachContacts } from "@/lib/admin/queries"
import {
  STAGE_GROUPS,
  TIERS,
  isFollowUpDue,
  stageGroupOf,
  type StageGroupId,
} from "@/lib/outreach/pipeline"
import { cn } from "@/lib/utils"
import type { OutreachContact } from "@/types"

type Filters = { stage?: StageGroupId; tier?: number; due?: boolean; q?: string }

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const raw = params[key]
  const single = Array.isArray(raw) ? raw[0] : raw
  return single?.trim() || undefined
}

/** Builds a filter URL, keeping the other filters as they are. */
function hrefWith(current: Filters, patch: Partial<Filters>) {
  const next = { ...current, ...patch }
  const search = new URLSearchParams()
  if (next.stage) search.set("stage", next.stage)
  if (next.tier) search.set("tier", String(next.tier))
  if (next.due) search.set("due", "1")
  if (next.q) search.set("q", next.q)
  const query = search.toString()
  return query ? `/admin/outreach?${query}` : "/admin/outreach"
}

export default async function AdminOutreachPage(props: PageProps<"/admin/outreach">) {
  const params = await props.searchParams
  const stageParam = value(params, "stage")
  const filters: Filters = {
    stage: STAGE_GROUPS.some((group) => group.id === stageParam)
      ? (stageParam as StageGroupId)
      : undefined,
    tier: Number(value(params, "tier")) || undefined,
    due: value(params, "due") === "1",
    q: value(params, "q"),
  }

  // ~70 rows: load once, count and filter here so the summary always shows
  // the whole pipeline whatever filter is applied.
  const all = await getOutreachContacts()
  const now = new Date()

  const stageCounts = Object.fromEntries(STAGE_GROUPS.map((group) => [group.id, 0])) as Record<
    StageGroupId,
    number
  >
  for (const contact of all) stageCounts[stageGroupOf(contact.status)] += 1
  const dueCount = all.filter((contact) => isFollowUpDue(contact, now)).length
  const readyCount = all.filter((c) => c.status === "pending" && c.contact_email).length
  const missingEmail = all.filter((c) => c.status === "pending" && !c.contact_email).length

  const query = filters.q?.toLowerCase()
  const contacts = all.filter(
    (contact) =>
      (!filters.stage || stageGroupOf(contact.status) === filters.stage) &&
      (!filters.tier || contact.tier === filters.tier) &&
      (!filters.due || isFollowUpDue(contact, now)) &&
      (!query ||
        [contact.company_name, contact.contact_name, contact.contact_email, contact.website_url]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(query)))
  )

  // Group by tier so the work order (Tier 1 first) stays visible.
  const groups = new Map<number | null, OutreachContact[]>()
  for (const contact of contacts) {
    const key = contact.tier ?? null
    groups.set(key, [...(groups.get(key) ?? []), contact])
  }

  const anyFilter = Boolean(filters.stage || filters.tier || filters.due || filters.q)

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">Outreach</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Ask auction companies for a listings feed. For each company: add a contact email,
            write the email with AI, read it, send. When they reply, open{" "}
            <span className="font-medium text-foreground">Details</span> and update the status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={`/admin/outreach/batch?type=${readyCount === 0 && dueCount > 0 ? "follow_up" : "first_contact"}`}
              />
            }
          >
            <Send />
            Batch email
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/api/outreach/export" prefetch={false} />}
          >
            <Download />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Pipeline summary — each card is a filter */}
      <nav aria-label="Pipeline stages" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STAGE_GROUPS.map((group) => {
          const active = filters.stage === group.id
          return (
            <Link
              key={group.id}
              href={hrefWith(filters, { stage: active ? undefined : group.id })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {stageCounts[group.id]}
              </span>
              <span className="text-xs text-muted-foreground">{group.label}</span>
            </Link>
          )
        })}
        <Link
          href={hrefWith(filters, { due: !filters.due })}
          aria-current={filters.due ? "true" : undefined}
          className={cn(
            "flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors",
            filters.due
              ? "border-amber-500 bg-amber-500/15"
              : dueCount > 0
                ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                : "border-border bg-background hover:bg-muted/50"
          )}
        >
          <span className="flex items-center gap-1.5 text-2xl font-semibold tabular-nums text-foreground">
            {dueCount}
            {dueCount > 0 && <BellRing className="size-4 text-amber-600" />}
          </span>
          <span className="text-xs text-muted-foreground">Follow-ups due</span>
        </Link>
      </nav>

      {/* Where to start */}
      {!anyFilter && (readyCount > 0 || missingEmail > 0) && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {readyCount > 0 ? (
            <Link
              href="/admin/outreach/batch?type=first_contact"
              className="font-medium text-primary hover:underline"
            >
              {readyCount} ready to email
            </Link>
          ) : (
            <span className="font-medium text-foreground">0 ready to email</span>
          )}
          {missingEmail > 0 && (
            <>
              {" "}· {missingEmail} still need a contact email (find it on the company&apos;s own
              contact page; we don&apos;t guess addresses)
            </>
          )}
          .
        </p>
      )}

      {/* Search + tier filter */}
      <div className="flex flex-col gap-3">
        <form className="flex gap-2" role="search">
          {filters.stage && <input type="hidden" name="stage" value={filters.stage} />}
          {filters.tier && <input type="hidden" name="tier" value={filters.tier} />}
          {filters.due && <input type="hidden" name="due" value="1" />}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search company, contact or email"
              aria-label="Search companies"
              className="h-9 w-full rounded-lg border border-border bg-background pr-2.5 pl-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-9">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by tier">
          <Link
            href={hrefWith(filters, { tier: undefined })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium pointer-coarse:min-h-11 pointer-coarse:content-center",
              !filters.tier
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            All tiers
          </Link>
          {TIERS.map((entry) => (
            <Link
              key={entry.tier}
              href={hrefWith(filters, { tier: filters.tier === entry.tier ? undefined : entry.tier })}
              title={entry.label}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium pointer-coarse:min-h-11 pointer-coarse:content-center",
                filters.tier === entry.tier
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              Tier {entry.tier} · {entry.label}
            </Link>
          ))}
          {anyFilter && (
            <Link
              href="/admin/outreach"
              className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
              Clear filters
            </Link>
          )}
        </div>
      </div>

      {/* List */}
      <p className="-mb-3 text-xs text-muted-foreground">
        Showing {contacts.length} of {all.length} companies
      </p>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No companies match these filters.
          <Link href="/admin/outreach" className="text-primary hover:underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {[...groups.entries()].map(([tier, rows]) => {
            const info = TIERS.find((entry) => entry.tier === tier)
            return (
              <section key={tier ?? "none"} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {info ? `Tier ${info.tier} · ${info.label}` : "No tier"}
                  <span className="ml-2 font-normal text-muted-foreground">{rows.length}</span>
                </h2>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
                  {rows.map((contact) => (
                    <OutreachRow key={contact.id} contact={contact} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
