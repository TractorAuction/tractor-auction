import { Resend } from "resend"

import { buildSearchParams } from "@/lib/listings/filters"
import { mapListing } from "@/lib/listings/queries"
import { searchListingsSafe } from "@/lib/listings/search-index"
import { SITE_URL } from "@/lib/seo/slug"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SearchFilters } from "@/types"

import { endingSoonEmail, savedSearchMatchesEmail } from "./templates"
import { signUnsubscribeToken } from "./unsubscribe-token"

type Row = Record<string, unknown>

export type AlertRunResult = { checked: number; sent: number; errors: string[] }

function resendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith("your_")) {
    throw new Error("RESEND_API_KEY is not configured. Add it to .env.local to send alert emails.")
  }
  return new Resend(apiKey)
}

function fromAddress(): string {
  const from = process.env.ALERTS_FROM_EMAIL
  if (!from) throw new Error("ALERTS_FROM_EMAIL is not configured.")
  return from
}

function unsubscribeUrlFor(userId: string): string {
  return `${SITE_URL}/api/alerts/unsubscribe?token=${signUnsubscribeToken(userId)}`
}

/**
 * Saved-search alerts: for every search with alerts on, re-runs it and
 * emails whatever is new since the last check. "New" is created_at, which is
 * when ingestion first wrote the row — not when the auction itself was
 * listed by the source — so a feed backfilling old inventory would read as
 * "new" here. Acceptable for v1; nothing currently backfills.
 */
export async function runSavedSearchAlerts(): Promise<AlertRunResult> {
  const supabase = createAdminClient()
  const errors: string[] = []
  let sent = 0

  const { data: searches, error } = await supabase
    .from("saved_searches")
    .select("id, user_id, name, filters, last_alerted_at, created_at, profiles(email, email_alerts_enabled)")
    .eq("alert_enabled", true)
    .limit(5000)

  if (error) throw new Error(`runSavedSearchAlerts: failed to load saved searches: ${error.message}`)

  let resend: Resend | null = null

  for (const row of (searches ?? []) as Row[]) {
    try {
      const profile = row.profiles as Row | null
      const email = profile?.email as string | undefined
      if (!email || profile?.email_alerts_enabled === false) continue

      const since = (row.last_alerted_at as string | null) ?? (row.created_at as string)
      const filters = { ...(row.filters as SearchFilters), sort_by: "recently_added" as const }

      const result = await searchListingsSafe(filters, 1, 50)
      const newMatches = result.listings.filter(
        (listing) => new Date(listing.created_at).getTime() > new Date(since).getTime()
      )
      if (newMatches.length === 0) continue

      const template = savedSearchMatchesEmail({
        searchName: (row.name as string | null) ?? "Saved search",
        searchPath: `/search?${buildSearchParams(row.filters as SearchFilters).toString()}`,
        listings: newMatches.slice(0, 10),
        unsubscribeUrl: unsubscribeUrlFor(row.user_id as string),
      })

      resend ??= resendClient()
      const { error: sendError } = await resend.emails.send({
        from: fromAddress(),
        to: email,
        subject: template.subject,
        text: template.text,
      })
      if (sendError) {
        errors.push(`saved_search ${row.id}: ${sendError.message}`)
        continue
      }

      await supabase
        .from("saved_searches")
        .update({ last_alerted_at: new Date().toISOString() })
        .eq("id", row.id)
      sent += 1
    } catch (itemError) {
      errors.push(
        `saved_search ${row.id}: ${itemError instanceof Error ? itemError.message : String(itemError)}`
      )
    }
  }

  return { checked: (searches ?? []).length, sent, errors }
}

/**
 * Ending-soon alerts: one email per watchlist item whose auction closes
 * within 24 hours, sent exactly once per item (ending_alert_sent_at gates
 * it) regardless of how often this job runs.
 */
export async function runWatchlistEndingSoonAlerts(): Promise<AlertRunResult> {
  const supabase = createAdminClient()
  const errors: string[] = []
  let sent = 0

  const { data: items, error } = await supabase
    .from("watchlist_items")
    .select("id, user_id, listing_id, listings(*, source:auction_sources(*)), profiles(email, email_alerts_enabled)")
    .is("ending_alert_sent_at", null)
    .limit(5000)

  if (error) throw new Error(`runWatchlistEndingSoonAlerts: failed to load watchlist: ${error.message}`)

  const now = Date.now()
  const windowEnd = now + 24 * 60 * 60 * 1000

  const due = ((items ?? []) as Row[]).filter((row) => {
    const listing = row.listings as Row | null
    if (!listing || listing.status !== "active") return false
    const endDate = listing.auction_end_date as string | null
    if (!endDate) return false
    const end = new Date(endDate).getTime()
    return end >= now && end <= windowEnd
  })

  let resend: Resend | null = null

  for (const row of due) {
    try {
      const profile = row.profiles as Row | null
      const email = profile?.email as string | undefined
      if (!email || profile?.email_alerts_enabled === false) continue

      const listing = mapListing(row.listings as Row)

      const template = endingSoonEmail({
        listings: [listing],
        unsubscribeUrl: unsubscribeUrlFor(row.user_id as string),
      })

      resend ??= resendClient()
      const { error: sendError } = await resend.emails.send({
        from: fromAddress(),
        to: email,
        subject: template.subject,
        text: template.text,
      })
      if (sendError) {
        errors.push(`watchlist_item ${row.id}: ${sendError.message}`)
        continue
      }

      await supabase
        .from("watchlist_items")
        .update({ ending_alert_sent_at: new Date().toISOString() })
        .eq("id", row.id)
      sent += 1
    } catch (itemError) {
      errors.push(
        `watchlist_item ${row.id}: ${itemError instanceof Error ? itemError.message : String(itemError)}`
      )
    }
  }

  return { checked: due.length, sent, errors }
}
