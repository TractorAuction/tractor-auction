import type { SearchFilters, SortOption } from "@/types"

/**
 * The URL is the single source of truth for search state, so the search page
 * and /api/search both parse filters from the same place and agree on names.
 */
export const FILTER_PARAMS = {
  query: "q",
  equipment_category: "category",
  make: "make",
  model: "model",
  year_min: "year_min",
  year_max: "year_max",
  horsepower_min: "hp_min",
  horsepower_max: "hp_max",
  hours_max: "hours_max",
  price_min: "price_min",
  price_max: "price_max",
  location_state: "state",
  source_id: "source",
  ending_before: "ending_before",
  sort_by: "sort",
} as const satisfies Record<keyof SearchFilters, string>

const SORT_OPTIONS: SortOption[] = [
  "ending_soon",
  "recently_added",
  "price_asc",
  "price_desc",
]

export const SORT_LABELS: Record<SortOption, string> = {
  ending_soon: "Ending soonest",
  recently_added: "Recently added",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
}

/** Accepts both Next's resolved searchParams object and a URLSearchParams. */
export type RawSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

function read(params: RawSearchParams, key: string): string | undefined {
  const value = params instanceof URLSearchParams ? params.get(key) : params[key]
  const single = Array.isArray(value) ? value[0] : value
  const trimmed = single?.trim()
  return trimmed ? trimmed : undefined
}

function readNumber(params: RawSearchParams, key: string): number | undefined {
  const raw = read(params, key)
  if (raw === undefined) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseFilters(params: RawSearchParams): SearchFilters {
  const sort = read(params, FILTER_PARAMS.sort_by)

  return {
    query: read(params, FILTER_PARAMS.query),
    equipment_category: read(params, FILTER_PARAMS.equipment_category),
    make: read(params, FILTER_PARAMS.make),
    model: read(params, FILTER_PARAMS.model),
    year_min: readNumber(params, FILTER_PARAMS.year_min),
    year_max: readNumber(params, FILTER_PARAMS.year_max),
    horsepower_min: readNumber(params, FILTER_PARAMS.horsepower_min),
    horsepower_max: readNumber(params, FILTER_PARAMS.horsepower_max),
    hours_max: readNumber(params, FILTER_PARAMS.hours_max),
    price_min: readNumber(params, FILTER_PARAMS.price_min),
    price_max: readNumber(params, FILTER_PARAMS.price_max),
    location_state: read(params, FILTER_PARAMS.location_state),
    source_id: read(params, FILTER_PARAMS.source_id),
    ending_before: read(params, FILTER_PARAMS.ending_before),
    sort_by: SORT_OPTIONS.includes(sort as SortOption) ? (sort as SortOption) : undefined,
  }
}

export function parsePage(params: RawSearchParams): number {
  const page = readNumber(params, "page") ?? 1
  return page >= 1 ? Math.trunc(page) : 1
}

/** Inverse of parseFilters, for building links that preserve search state. */
export function buildSearchParams(filters: SearchFilters, page = 1): URLSearchParams {
  const params = new URLSearchParams()

  for (const [key, param] of Object.entries(FILTER_PARAMS)) {
    const value = filters[key as keyof SearchFilters]
    if (value !== undefined && value !== "") params.set(param, String(value))
  }

  if (page > 1) params.set("page", String(page))

  return params
}

/** True when anything beyond sorting is narrowing the result set. */
export function hasActiveFilters(filters: SearchFilters): boolean {
  return Object.entries(filters).some(
    ([key, value]) => key !== "sort_by" && value !== undefined && value !== ""
  )
}
