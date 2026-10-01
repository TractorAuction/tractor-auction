/**
 * Every outbound request an ingestion run makes goes through here.
 *
 * Feeds belong to other companies, so requests identify themselves honestly, cap
 * how long they may run, and back off on the status codes that mean "slow down"
 * rather than hammering through them. Nothing here tries to look like a browser:
 * if a source blocks automated access, that is an answer, and the fix is a
 * partner feed, not a disguise.
 */

export const INGEST_USER_AGENT =
  "TractorAuctionBot/1.0 (+https://www.tractorauction.com/about; partnerships@tractorauction.com)"

/** Status codes worth a second attempt. 403/404 are answers, not hiccups. */
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504])

export class FeedFetchError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
    this.name = "FeedFetchError"
  }
}

export type FetchFeedOptions = {
  headers?: Record<string, string>
  /** Hard ceiling for this single request, independent of the run deadline. */
  timeoutMs?: number
  attempts?: number
  /** Response bodies are capped so a runaway feed cannot exhaust memory. */
  maxBytes?: number
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchFeed(
  url: string,
  { headers = {}, timeoutMs = 20_000, attempts = 3, maxBytes = 16 * 1024 * 1024 }: FetchFeedOptions = {}
): Promise<string> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": INGEST_USER_AGENT,
          accept: "application/json, text/csv, application/xml, text/xml, */*",
          ...headers,
        },
        redirect: "follow",
        signal: controller.signal,
      })

      if (!response.ok) {
        const retryable = RETRYABLE.has(response.status)
        const error = new FeedFetchError(
          `${response.status} ${response.statusText} from ${url}`,
          response.status
        )
        if (!retryable || attempt === attempts) throw error
        lastError = error
        // Honour Retry-After when the server sends one.
        const retryAfter = Number(response.headers.get("retry-after"))
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 1500)
        continue
      }

      const length = Number(response.headers.get("content-length"))
      if (Number.isFinite(length) && length > maxBytes) {
        throw new FeedFetchError(`feed at ${url} is ${length} bytes, over the ${maxBytes} cap`)
      }

      const body = await response.text()
      if (body.length > maxBytes) {
        throw new FeedFetchError(`feed at ${url} exceeded the ${maxBytes} byte cap`)
      }

      return body
    } catch (error) {
      const wrapped =
        error instanceof FeedFetchError
          ? error
          : new FeedFetchError(
              error instanceof Error && error.name === "AbortError"
                ? `timed out after ${timeoutMs}ms fetching ${url}`
                : `failed fetching ${url}: ${error instanceof Error ? error.message : String(error)}`
            )

      // A non-retryable status is final; stop burning attempts on it.
      if (wrapped.status && !RETRYABLE.has(wrapped.status)) throw wrapped

      lastError = wrapped
      if (attempt === attempts) throw wrapped
      await sleep(attempt * 1500)
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new FeedFetchError(`failed fetching ${url}`)
}
