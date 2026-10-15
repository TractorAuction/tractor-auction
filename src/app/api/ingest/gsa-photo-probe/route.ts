import { NextResponse } from "next/server"

import { requireIngestSecret } from "@/lib/ingestion/authorize"
import { fetchFeed, INGEST_USER_AGENT } from "@/lib/ingestion/fetch"

/**
 * Answers one question: can our server load the photo behind GSA's `imageURL`?
 *
 * The GSA connector drops that field because it 401s in a browser. What has
 * not been checked is whether it loads server-side, straight after the feed is
 * read (the link may carry a short-lived token) or with our api.data.gov key.
 * If any variant returns an image, photos can be downloaded at sync time and
 * hosted by us; if none does, GSA photos are out of reach and this route can
 * be deleted.
 *
 *   curl https://www.tractorauction.com/api/ingest/gsa-photo-probe \
 *     -H "authorization: Bearer $CRON_SECRET"
 *
 * Reports status, content type and size only: never the key, and never the
 * image link's query string, which may hold a token.
 */
export const dynamic = "force-dynamic"
export const maxDuration = 60

const FEED_URL = "https://api.gsa.gov/assets/gsaauctions/v2/auctions"
const SAMPLE_SIZE = 3

type Attempt = { variant: string; status: number | null; contentType: string | null; bytes: number | null; detail?: string }

export async function GET(request: Request) {
  const auth = requireIngestSecret(request)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
  }

  const apiKey = process.env.GSA_AUCTIONS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ data: null, error: "GSA_AUCTIONS_API_KEY is not set" }, { status: 503 })
  }

  let results: unknown[]
  try {
    const body = await fetchFeed(FEED_URL, { headers: { "X-API-KEY": apiKey }, timeoutMs: 40_000, attempts: 1 })
    results = ((JSON.parse(body) as { Results?: unknown[] }).Results ?? []) as unknown[]
  } catch (error) {
    return NextResponse.json(
      { data: null, error: `GSA feed fetch failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 502 }
    )
  }

  const links = results
    .map((entry) => (entry as Record<string, unknown>)?.imageURL)
    .filter((value): value is string => typeof value === "string" && /^https?:\/\//i.test(value.trim()))
    .slice(0, SAMPLE_SIZE)
    .map((value) => value.trim())

  const samples = []
  for (const link of links) {
    const url = new URL(link)
    const withKeyParam = new URL(link)
    withKeyParam.searchParams.set("api_key", apiKey)

    const attempts: Attempt[] = [
      await probe("plain", link, {}),
      await probe("x-api-key header", link, { "X-API-KEY": apiKey }),
      await probe("api_key query param", withKeyParam.toString(), {}),
      await probe("browser-like referer", link, { referer: "https://www.gsaauctions.gov/" }),
    ]

    samples.push({
      link: `${url.origin}${url.pathname}`,
      linkHasQuery: url.search.length > 0,
      attempts,
    })
  }

  const loadable = samples.some((sample) =>
    sample.attempts.some((attempt) => attempt.status === 200 && attempt.contentType?.startsWith("image/"))
  )

  const data = {
    lotsInFeed: results.length,
    lotsWithImageUrl: results.filter((entry) => typeof (entry as Record<string, unknown>)?.imageURL === "string").length,
    loadable,
    samples,
  }
  console.log("[gsa-photo-probe]", JSON.stringify(data))
  return NextResponse.json({ data, error: null })
}

async function probe(variant: string, url: string, headers: Record<string, string>): Promise<Attempt> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": INGEST_USER_AGENT, accept: "image/*,*/*", ...headers },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    })
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type")
    return {
      variant,
      status: response.status,
      contentType,
      bytes: buffer.byteLength,
      detail: contentType?.startsWith("image/") ? undefined : new TextDecoder().decode(buffer.slice(0, 160)),
    }
  } catch (error) {
    return { variant, status: null, contentType: null, bytes: null, detail: error instanceof Error ? error.message : String(error) }
  }
}
