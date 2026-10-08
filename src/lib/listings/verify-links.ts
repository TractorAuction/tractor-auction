import { markExpiredInIndex } from "@/lib/ingestion/expire"
import { createAdminClient } from "@/lib/supabase/admin"

const CONCURRENCY = 5
const REQUEST_TIMEOUT_MS = 8_000
const USER_AGENT = "TractorAuctionLinkCheck/1.0 (+https://tractorauction.com)"

type LinkStatus = "ok" | "dead" | "unverified"

export type VerifySummary = {
  checked: number
  ok: number
  dead: number
  unverified: number
}

/**
 * Only 404 and 410 count as dead. A 403 or 429 is a bot wall (several auction
 * sites sit behind Cloudflare), and a 5xx or timeout is the site having a bad
 * minute — expiring a live auction over either would hide inventory that a
 * buyer could still bid on.
 */
function classify(status: number): LinkStatus {
  if (status === 404 || status === 410) return "dead"
  if (status >= 200 && status < 400) return "ok"
  return "unverified"
}

async function request(url: string, method: "HEAD" | "GET"): Promise<number> {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT },
    cache: "no-store",
  })
  // Never read the body; the status is the whole answer.
  await response.body?.cancel()
  return response.status
}

async function check(url: string): Promise<LinkStatus> {
  try {
    const status = await request(url, "HEAD")
    // Plenty of servers answer HEAD with 405/501, or 404 when only GET is
    // routed; confirm with a GET before believing a bad answer.
    if (status === 405 || status === 501 || classify(status) !== "ok") {
      return classify(await request(url, "GET"))
    }
    return "ok"
  } catch {
    return "unverified"
  }
}

/**
 * Pings each active listing's original_url, least recently verified first, and
 * expires the ones whose auction page is gone. Bounded by `budgetMs` so it fits
 * inside a serverless invocation; whatever it does not reach this run is first
 * in line next run.
 */
export async function verifyOutboundLinks({
  limit = 200,
  budgetMs = 45_000,
}: { limit?: number; budgetMs?: number } = {}): Promise<VerifySummary> {
  const supabase = createAdminClient()
  const deadline = Date.now() + budgetMs

  const { data, error } = await supabase
    .from("listings")
    .select("id, original_url")
    .eq("status", "active")
    .order("last_verified_at", { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) throw new Error(`verifyOutboundLinks: failed to read listings: ${error.message}`)

  const queue = [...(data ?? [])]
  const results: { id: string; status: LinkStatus }[] = []

  async function worker() {
    for (;;) {
      if (Date.now() > deadline) return
      const next = queue.shift()
      if (!next) return
      results.push({ id: next.id as string, status: await check(next.original_url as string) })
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  const now = new Date().toISOString()
  const byStatus = (status: LinkStatus) => results.filter((r) => r.status === status).map((r) => r.id)

  for (const status of ["ok", "dead", "unverified"] as const) {
    const ids = byStatus(status)
    if (ids.length === 0) continue

    const update: Record<string, unknown> = { last_verified_at: now, link_status: status }
    if (status === "dead") Object.assign(update, { status: "expired", updated_at: now })

    const { error: updateError } = await supabase.from("listings").update(update).in("id", ids)
    if (updateError) {
      throw new Error(`verifyOutboundLinks: failed to record ${status} links: ${updateError.message}`)
    }
  }

  await markExpiredInIndex(byStatus("dead"))

  return {
    checked: results.length,
    ok: byStatus("ok").length,
    dead: byStatus("dead").length,
    unverified: byStatus("unverified").length,
  }
}
