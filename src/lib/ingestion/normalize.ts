import { US_STATES } from "@/lib/seo/slug"

import type { FeedConfig, ItemError, NormalizedListing, RawItem } from "./types"

/**
 * Sources spell the same manufacturer a dozen ways, and every brand landing
 * page, facet and filter matches on the stored string. Canonicalising on the way
 * in means /brand/john-deere finds "JOHN DEERE" rows without a lookup table and
 * without the facet list showing the same make four times.
 */
const MAKE_ALIASES: Record<string, string> = {
  "john deere": "John Deere",
  deere: "John Deere",
  "deere & company": "John Deere",
  jd: "John Deere",
  kubota: "Kubota",
  "case ih": "Case IH",
  caseih: "Case IH",
  case: "Case IH",
  "j i case": "Case IH",
  "new holland": "New Holland",
  newholland: "New Holland",
  nh: "New Holland",
  "massey ferguson": "Massey Ferguson",
  massey: "Massey Ferguson",
  mf: "Massey Ferguson",
  fendt: "Fendt",
  claas: "Claas",
  challenger: "Challenger",
  agco: "AGCO",
  "agco allis": "AGCO",
  kioti: "Kioti",
  mahindra: "Mahindra",
  yanmar: "Yanmar",
  "ls tractor": "LS Tractor",
  ls: "LS Tractor",
  branson: "Branson",
  "mccormick": "McCormick",
  landini: "Landini",
  valtra: "Valtra",
  versatile: "Versatile",
  "allis chalmers": "Allis-Chalmers",
  "allis-chalmers": "Allis-Chalmers",
  oliver: "Oliver",
  "international harvester": "International Harvester",
  ih: "International Harvester",
  ihc: "International Harvester",
  international: "International Harvester",
  ford: "Ford",
  "white": "White",
  steiger: "Steiger",
  belarus: "Belarus",
  zetor: "Zetor",
  "same": "SAME",
  "deutz fahr": "Deutz-Fahr",
  "deutz-fahr": "Deutz-Fahr",
  deutz: "Deutz-Fahr",
  bobcat: "Bobcat",
  caterpillar: "Caterpillar",
  cat: "Caterpillar",
  "kinze": "Kinze",
  "great plains": "Great Plains",
  krone: "Krone",
  "vermeer": "Vermeer",
  "hesston": "Hesston",
  "gleaner": "Gleaner",
}

/**
 * Category is a closed set in the UI (EQUIPMENT_CATEGORIES drives the category
 * pages), so free-text equipment descriptions are bucketed rather than stored raw.
 * Order matters: the first match wins, so narrower terms come first — and the
 * non-agricultural buckets come before "tractor", because a "truck tractor" is
 * a semi and a "tractor loader backhoe" is a backhoe, not a farm tractor.
 */
const CATEGORY_PATTERNS: Array<[RegExp, string]> = [
  [/\b(trucks?|day cab|sleeper cab|semi|pickup|dump body|(?:semi|flatbed|lowboy|gooseneck|cargo) trailer)\b/i, "truck-trailer"],
  [/\b(backhoe|excavator|motor grader|grader|bull ?dozer|dozer|trencher|compactor|telehandler|wheel loader)\b/i, "construction"],
  [/\b(skid[\s-]?steer|track loader|compact track)\b/i, "skid-steer"],
  [/\b(combines?|corn head|grain head|draper head)\b/i, "combine"],
  [/\b(planter|grain drill|seeder|air seeder)\b/i, "planter"],
  [/\b(sprayer|applicator|spreader|floater)\b/i, "sprayer"],
  [/\b(disk|disc|ripper|cultivator|tillage|plow|harrow|tiller|soil preparation)\b/i, "tillage"],
  [/\b(baler|mower|windrower|swather|rake|tedder|hay|forage)\b/i, "hay-forage"],
  [/\btractors?\b/i, "tractor"],
  // After "tractor", so "Tractor w/ Loader and Forklift Attachments" stays a tractor.
  [/\b(attachments?|implements?|pallet forks?|angle blade|box blade|bucket|three[\s-]point|3[\s-]point)\b/i, "attachment"],
]

/**
 * Manufacturer names that contain category words. "International Harvester"
 * once filed an IHC backhoe under combines because "harvester" matched.
 */
const MAKE_NOISE = /\b(international harvester|ihc)\b/gi

/**
 * Pickup and logistics boilerplate that names equipment without describing the
 * lot: "dock can accommodate a tractor trailer size truck" put a printer in
 * trucks. Exported for connectors that pre-filter on description text.
 */
export const LOGISTICS_NOISE = /\b(tractor[\s-]trailers?|semi[\s-]trucks?|trailer size|size truck|truck access|loading dock)\b/gi

const VALID_CATEGORIES = new Set([
  "tractor",
  "combine",
  "planter",
  "sprayer",
  "tillage",
  "hay-forage",
  "skid-steer",
  "attachment",
  "construction",
  "truck-trailer",
  "other",
])

const STATE_NAME_TO_CODE = new Map(
  Object.entries(US_STATES).map(([code, name]) => [name.toLowerCase(), code])
)

/** Reads a dotted path out of a nested object. */
export function readPath(value: unknown, path: string): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((current, key) => {
      if (current === null || typeof current !== "object") return undefined
      return (current as Record<string, unknown>)[key]
    }, value)
}

function text(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Feeds deliver money as "$118,500.00", "118500", "USD 118500" or "". Anything
 * that is not a positive finite number after stripping becomes undefined, so a
 * bad price reads as "no bid yet" rather than as $0.
 */
export function parseMoney(value: string | undefined): number | undefined {
  const raw = text(value)
  if (!raw) return undefined
  const cleaned = raw.replace(/[^0-9.-]/g, "")
  if (!cleaned || cleaned === "-" || cleaned === ".") return undefined
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  // A price above this is a feed artefact, not a tractor.
  if (parsed > 100_000_000) return undefined
  return Math.round(parsed * 100) / 100
}

export function parseInteger(
  value: string | undefined,
  { min, max }: { min: number; max: number }
): number | undefined {
  const raw = text(value)
  if (!raw) return undefined
  const cleaned = raw.replace(/[^0-9-]/g, "")
  if (!cleaned) return undefined
  const parsed = Number.parseInt(cleaned, 10)
  if (!Number.isFinite(parsed)) return undefined
  if (parsed < min || parsed > max) return undefined
  return parsed
}

/**
 * Dates arrive as ISO strings, US-formatted dates, and epoch seconds or millis.
 * An unparseable date is dropped rather than guessed: auction_end_date drives
 * "ending soon" sorting and the 24h alert job, so a wrong value is worse than none.
 */
export function parseDate(value: string | undefined): string | undefined {
  const raw = text(value)
  if (!raw) return undefined

  if (/^\d{10}$/.test(raw)) return new Date(Number(raw) * 1000).toISOString()
  if (/^\d{13}$/.test(raw)) return new Date(Number(raw)).toISOString()

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return undefined

  const year = parsed.getUTCFullYear()
  if (year < 1990 || year > 2100) return undefined

  return parsed.toISOString()
}

export function canonicalMake(value: string | undefined): string | undefined {
  const raw = text(value)
  if (!raw) return undefined
  const key = raw.toLowerCase().replace(/[^a-z0-9& ]+/g, " ").replace(/\s+/g, " ").trim()
  if (MAKE_ALIASES[key]) return MAKE_ALIASES[key]

  // Unknown makes are kept but title-cased, so the facet list stays tidy and a
  // genuinely new manufacturer still reaches the UI instead of being dropped.
  return raw
    .split(/\s+/)
    .map((word) =>
      word.length <= 3 && word === word.toUpperCase()
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ")
}

export function canonicalState(value: string | undefined): string | undefined {
  const raw = text(value)
  if (!raw) return undefined

  const upper = raw.toUpperCase()
  if (upper.length === 2 && US_STATES[upper]) return upper

  const byName = STATE_NAME_TO_CODE.get(raw.toLowerCase())
  if (byName) return byName

  return undefined
}

function matchCategory(value: string | undefined): string | undefined {
  if (!value) return undefined
  const haystack = value.replace(MAKE_NOISE, " ").replace(LOGISTICS_NOISE, " ")
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(haystack)) return category
  }
  return undefined
}

/**
 * The title is what the seller called the item, so it decides first. The
 * description only breaks a tie when the title names no equipment type at
 * all: descriptions mention tractors constantly ("fits any 40 HP tractor"),
 * and letting them vote equally put implements and trucks in tractor search.
 */
export function canonicalCategory(
  explicit: string | undefined,
  title: string | undefined,
  description?: string
): string {
  const raw = text(explicit)
  if (raw) {
    const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    if (VALID_CATEGORIES.has(slug)) return slug
  }

  // The description is only consulted for a recognised manufacturer's
  // equipment ("John Deere 410-G", described as a backhoe); for an unbranded
  // lot it is too noisy to trust. Anything not clearly identified lands in
  // "other", never in "tractor": tractor search must only return tractors.
  const fromDescription = inferFromTitle(title).make ? matchCategory(description) : undefined
  return matchCategory(raw) ?? matchCategory(title) ?? fromDescription ?? "other"
}

/** Short or common-word aliases that only count as a make at the very start of
 *  a title ("Case tractor"), never mid-sentence ("white pickup", "in case"). */
const AMBIGUOUS_MAKES = new Set(["case", "white", "same", "cat", "ls", "ih", "jd", "nh", "mf", "international", "ford"])

const MAKE_KEYS = Object.keys(MAKE_ALIASES).sort((a, b) => b.length - a.length)

const MODEL_FILLER = new Set([
  "tractor", "tractors", "compact", "utility", "farm", "backhoe", "loader", "motor", "grader",
  "truck", "w", "with", "the", "a", "-",
])

/**
 * Feeds like GSA Auctions carry one free-text name ("2015 JOHN DEERE
 * TRACTOR-6145R") and no make/model/year fields. Without these, brand pages,
 * the make filter and comparisons are empty for the whole source.
 */
export function inferFromTitle(title: string | undefined): {
  year?: string
  make?: string
  model?: string
} {
  const raw = text(title)
  if (!raw) return {}

  const yearMatch = raw.match(/^\s*((?:19|20)\d{2})\b/)
  const rest = (yearMatch ? raw.slice(yearMatch[0].length) : raw).trim()
  const lower = rest.toLowerCase()

  let make: string | undefined
  let afterMake = ""
  for (const key of MAKE_KEYS) {
    const pattern = new RegExp(`(^|[^a-z])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^a-z])`, "i")
    const match = pattern.exec(lower)
    if (!match) continue
    const start = match.index + match[1].length
    if (AMBIGUOUS_MAKES.has(key) && start !== 0) continue
    make = MAKE_ALIASES[key]
    afterMake = rest.slice(start + key.length)
    break
  }

  let model: string | undefined
  if (make) {
    const tokens = afterMake.split(/[\s,/]+|(?<=[a-z])-(?=\d)/i).filter(Boolean)
    for (const token of tokens) {
      const cleaned = token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "")
      if (!cleaned || MODEL_FILLER.has(cleaned.toLowerCase())) continue
      if (/\d/.test(cleaned) && cleaned.length <= 12) model = cleaned.toUpperCase()
      break
    }
  }

  return { year: yearMatch?.[1], make, model }
}

/**
 * Images must be absolute https URLs: they are rendered through next/image,
 * whose remotePatterns only permit https hosts, and a relative path from a feed
 * would resolve against tractorauction.com and 404.
 */
export function parseImages(value: string | undefined, baseUrl?: string): string[] {
  const raw = text(value)
  if (!raw) return []

  const candidates = raw.startsWith("[")
    ? safeJsonArray(raw)
    : raw.split(/[|,\s]+/).filter(Boolean)

  const seen = new Set<string>()
  const images: string[] = []

  for (const candidate of candidates) {
    const absolute = absoluteUrl(candidate, baseUrl)
    if (!absolute || seen.has(absolute)) continue
    seen.add(absolute)
    images.push(absolute)
    if (images.length >= 24) break
  }

  return images
}

function safeJsonArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === "string")
  } catch {
    return []
  }
}

export function absoluteUrl(value: string | undefined, baseUrl?: string): string | undefined {
  const raw = text(value)
  if (!raw) return undefined
  try {
    const url = new URL(raw, baseUrl)
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined
    // Upgrade http to https rather than dropping: next/image rejects http hosts.
    if (url.protocol === "http:") url.protocol = "https:"
    return url.toString()
  } catch {
    return undefined
  }
}

const DEFAULT_FIELD_MAP: Record<string, string> = {
  external_id: "external_id",
  title: "title",
  equipment_category: "equipment_category",
  make: "make",
  model: "model",
  year: "year",
  horsepower: "horsepower",
  hours: "hours",
  condition: "condition",
  drive_type: "drive_type",
  serial_number: "serial_number",
  lot_number: "lot_number",
  location_city: "location_city",
  location_state: "location_state",
  location_zip: "location_zip",
  auction_company: "auction_company",
  auction_end_date: "auction_end_date",
  auction_type: "auction_type",
  current_bid: "current_bid",
  buy_it_now_price: "buy_it_now_price",
  description: "description",
  images: "images",
  original_url: "original_url",
}

/** A feed with no title still gets one from its own fields, if it has any. */
function derivedTitle(...parts: Array<string | undefined>): string | undefined {
  const joined = parts.filter(Boolean).join(" ").trim()
  return joined ? joined : undefined
}

/**
 * Maps and coerces one raw item. Returns an ItemError instead of throwing so a
 * single bad row is recorded against the run and the rest of the feed continues.
 */
export function normalizeItem(
  item: RawItem,
  { sourceId, config, baseUrl }: { sourceId: string; config: FeedConfig; baseUrl?: string }
): { listing: NormalizedListing } | { error: ItemError } {
  const map = { ...DEFAULT_FIELD_MAP, ...(config.fieldMap ?? {}) }
  const statics = config.staticFields ?? {}

  const field = (column: string): string | undefined => {
    const staticValue = statics[column]
    if (staticValue !== undefined) return String(staticValue)
    const key = map[column]
    return key ? text(item[key]) : undefined
  }

  const externalId = field("external_id")
  const originalUrl = absoluteUrl(field("original_url"), baseUrl)

  // Both of these are load-bearing: external_id is half the dedupe key, and
  // original_url is the entire point of the listing — we send users to it.
  if (!externalId) {
    return { error: { reason: "missing external_id" } }
  }
  if (!originalUrl) {
    return { error: { externalId, reason: "missing or unusable original_url" } }
  }

  const title = field("title")
  const inferred = inferFromTitle(title)
  const make = canonicalMake(field("make")) ?? inferred.make
  const model = field("model") ?? inferred.model
  const description = field("description")

  // Parsed before the title so a rejected year cannot leak into it: a row whose
  // year fails validation must not end up titled "9999 John Deere 6155R".
  const year = parseInteger(field("year") ?? inferred.year, {
    min: 1900,
    max: new Date().getFullYear() + 2,
  })
  const endDate = parseDate(field("auction_end_date"))

  return {
    listing: {
      external_id: externalId,
      source_id: sourceId,
      title: title ?? derivedTitle(year ? String(year) : undefined, make, model),
      equipment_category: canonicalCategory(field("equipment_category"), title, description),
      make,
      model,
      year,
      horsepower: parseInteger(field("horsepower"), { min: 1, max: 2000 }),
      hours: parseInteger(field("hours"), { min: 0, max: 100_000 }),
      condition: field("condition"),
      drive_type: field("drive_type"),
      serial_number: field("serial_number"),
      lot_number: field("lot_number"),
      location_city: field("location_city"),
      location_state: canonicalState(field("location_state")),
      location_zip: field("location_zip"),
      auction_company: field("auction_company"),
      auction_end_date: endDate,
      auction_type: field("auction_type"),
      current_bid: parseMoney(field("current_bid")),
      buy_it_now_price: parseMoney(field("buy_it_now_price")),
      description,
      images: parseImages(field("images"), baseUrl),
      original_url: originalUrl,
      // A feed that is still listing an item whose auction has passed is treated
      // as expired here; the expiry sweep catches rows that drop out entirely.
      status: endDate && new Date(endDate).getTime() < Date.now() ? "expired" : "active",
    },
  }
}
