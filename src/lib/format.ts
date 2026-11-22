const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function formatCurrency(value?: number | null) {
  if (value === undefined || value === null) return null
  return currency.format(value)
}

export function formatNumber(value?: number | null) {
  if (value === undefined || value === null) return null
  return value.toLocaleString("en-US")
}

/**
 * Pages render on the server (UTC on Vercel), so dates and times are pinned to
 * US Central, the convention most ag auctions close on, instead of following
 * whichever timezone the server happens to run in.
 */
const DISPLAY_TIME_ZONE = "America/Chicago"

export function formatDate(value?: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  })
}

export function formatDateTime(value?: string | null) {
  if (!value) return null
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: DISPLAY_TIME_ZONE,
  })
}

export function formatLocation(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(", ") || null
}

const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" })

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
]

/** "2 hours ago", "yesterday", "just now". */
export function formatRelativeTime(value?: string | null, now = Date.now()) {
  if (!value) return null
  const ms = new Date(value).getTime()
  if (!Number.isFinite(ms)) return null
  const diff = ms - now
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= size) return relative.format(Math.round(diff / size), unit)
  }
  return "just now"
}

const centralParts = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

function central(ms: number) {
  const parts = Object.fromEntries(
    centralParts.formatToParts(ms).map((part) => [part.type, part.value])
  ) as Record<string, string>
  return { day: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}:${parts.second}` }
}

/**
 * True when the source gave only a closing date, not a time. Such sources
 * (GSA Auctions: its feed has `aucEndDt: "2026-11-23"` and nothing more) are
 * stored as 23:59:59 US Central on that day; see endOfDayCentral in the GSA
 * connector. The real close is some time that day, different per lot, so a
 * ticking countdown to midnight would be wrong by hours. Callers show the
 * date instead.
 */
export function isDateOnlyEnd(value?: string | null) {
  if (!value) return false
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) && central(ms).time === "23:59:59"
}

/** "Nov 23, 2026" for a date-only close; the full date and time otherwise. */
export function formatAuctionEnd(value?: string | null) {
  return isDateOnlyEnd(value) ? formatDate(value) : formatDateTime(value)
}

/**
 * Card-sized auction clock: "Ends in 5h 20m" inside a day, "Ends in 3d 4h"
 * inside a week, the date after that. `urgent` marks the final 24 hours.
 * A date-only close reads "Closes today", "Closes tomorrow" or the date,
 * because counting down to a guessed time would be wrong.
 */
export function formatTimeLeft(value?: string | null, now = Date.now()) {
  if (!value) return null
  const end = new Date(value).getTime()
  if (!Number.isFinite(end)) return null
  const diff = end - now
  if (diff <= 0) return { label: "Ended", urgent: false }

  if (isDateOnlyEnd(value)) {
    const endDay = central(end).day
    if (endDay === central(now).day) return { label: "Closes today", urgent: true }
    if (endDay === central(now + 24 * 60 * 60 * 1000).day) return { label: "Closes tomorrow", urgent: false }
    return {
      label: `Closes ${new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: DISPLAY_TIME_ZONE })}`,
      urgent: false,
    }
  }

  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (hours < 24) {
    return { label: hours > 0 ? `Ends in ${hours}h ${minutes % 60}m` : `Ends in ${minutes}m`, urgent: true }
  }
  if (days < 7) return { label: `Ends in ${days}d ${hours % 24}h`, urgent: false }
  return { label: `Ends ${formatDate(value)}`, urgent: false }
}
