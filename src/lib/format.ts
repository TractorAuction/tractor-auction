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

/**
 * Card-sized auction clock: "Ends in 5h 20m" inside a day, "Ends in 3d 4h"
 * inside a week, the date after that. `urgent` marks the final 24 hours.
 */
export function formatTimeLeft(value?: string | null, now = Date.now()) {
  if (!value) return null
  const end = new Date(value).getTime()
  if (!Number.isFinite(end)) return null
  const diff = end - now
  if (diff <= 0) return { label: "Ended", urgent: false }

  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (hours < 24) {
    return { label: hours > 0 ? `Ends in ${hours}h ${minutes % 60}m` : `Ends in ${minutes}m`, urgent: true }
  }
  if (days < 7) return { label: `Ends in ${days}d ${hours % 24}h`, urgent: false }
  return { label: `Ends ${formatDate(value)}`, urgent: false }
}
