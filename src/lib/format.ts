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
