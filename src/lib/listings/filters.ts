import { normalizeZip, RADIUS_OPTIONS } from "@/lib/geo/constants"
import { EQUIPMENT_CATEGORIES } from "@/lib/seo/slug"
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
  zip: "zip",
  radius_miles: "radius",
  sort_by: "sort",
} as const satisfies Record<keyof SearchFilters, string>

const SORT_OPTIONS: SortOption[] = [
  "ending_soon",
  "recently_added",
  "price_asc",
  "price_desc",
  "distance",
]

export const SORT_LABELS: Record<SortOption, string> = {
  ending_soon: "Ending soonest",
  recently_added: "Recently added",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  distance: "Nearest first",
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

/** "tractors", "Tractor", "skid steers", "combines" → the category value. */
const CATEGORY_WORDS = new Map<string, string>(
  EQUIPMENT_CATEGORIES.flatMap((category) => {
    const words = [category.slug, category.value, category.label].map((word) =>
      word.toLowerCase().replace(/[^a-z]+/g, " ").trim()
    )
    return words.flatMap((word) => [word, word.replace(/s$/, "")]).map((word) => [word, category.value])
  })
)

/**
 * A search box query that is just an equipment type is a category filter, not
 * a text search: free text "tractors" also matches a truck whose description
 * mentions a tractor trailer, while the category holds tractors only.
 */
function categoryFromQuery(query: string | undefined): string | undefined {
  if (!query) return undefined
  return CATEGORY_WORDS.get(query.toLowerCase().replace(/[^a-z]+/g, " ").trim())
}

export function parseFilters(params: RawSearchParams): SearchFilters {
  const sort = read(params, FILTER_PARAMS.sort_by)
  const rawQuery = read(params, FILTER_PARAMS.query)
  const explicitCategory = read(params, FILTER_PARAMS.equipment_category)
  const queryCategory = explicitCategory ? undefined : categoryFromQuery(rawQuery)

  return {
    query: queryCategory ? undefined : rawQuery,
    equipment_category: explicitCategory ?? queryCategory,
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
    zip: normalizeZip(read(params, FILTER_PARAMS.zip)),
    // Only the offered radii are accepted; anything else means nationwide.
    radius_miles: RADIUS_OPTIONS.find(
      (miles) => miles === readNumber(params, FILTER_PARAMS.radius_miles)
    ),
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
