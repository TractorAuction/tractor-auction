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

export function formatDate(value?: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
