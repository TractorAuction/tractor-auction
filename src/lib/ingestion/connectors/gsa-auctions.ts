import { fetchFeed } from "../fetch"
import { LOGISTICS_NOISE } from "../normalize"
import type { Connector, ConnectorContext, RawItem } from "../types"

/**
 * GSA Auctions — a free, public, self-service federal API
 * (gsa.github.io/auctions_api), not a partner feed. No outreach needed: the
 * blocker here is a free api.data.gov key, not a reply from anyone.
 *
 * This is a dedicated connector, not the generic json-api one, for two
 * reasons neither a fieldMap can express:
 *
 *   1. Relevance. GSA Auctions sells every category of federal surplus —
 *      office furniture, modems, vehicles, everything — not just agricultural
 *      equipment. Ingesting it wholesale would mean filing cabinets showing
 *      up on a tractor auction site. isAgEquipment() (below) filters to a
 *      deliberately strict set of unambiguous phrases and named ag-equipment
 *      manufacturers — not normalize.ts's CATEGORY_PATTERNS, whose bare
 *      generic words ("disc", "header", "plow") are safe only when every
 *      candidate is already known ag equipment, which isn't true here.
 *   2. Identity. Each result is one lot within a sale, but the only globally
 *      unique id is the (saleNo, lotNo) pair — lotNo alone repeats across
 *      sales. The composite is built here rather than adding a generic
 *      "join two fields" concept to FeedConfig for a need only this source has.
 *
 * The live response shape (camelCase keys, a flat HTML description string, a
 * `Results` envelope) differs from GSA's own published OpenAPI spec (which
 * documents PascalCase keys and a nested LotInfo array) — confirmed by an
 * actual request, not assumed from the docs.
 */
export const gsaAuctionsConnector: Connector = {
  name: "gsa-auctions",

  async fetchItems({ source, config }: ConnectorContext) {
    const url = config.url ?? "https://api.gsa.gov/assets/gsaauctions/v2/auctions"

    const keyEnv = config.authHeaderEnv ?? "GSA_AUCTIONS_API_KEY"
    const apiKey = process.env[keyEnv]
    if (!apiKey) {
      throw new Error(
        `${keyEnv} is not set. Register a free key at https://api.data.gov/signup/ ` +
          `(instant, no approval wait) — GSA Auctions needs no outreach, just this key.`
      )
    }

    const body = await fetchFeed(url, { headers: { [config.authHeaderName ?? "X-API-KEY"]: apiKey } })

    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      throw new Error(`GSA Auctions API at ${url} did not return valid JSON`)
    }

    const results = (parsed as { Results?: unknown[] })?.Results
    if (!Array.isArray(results)) {
      throw new Error(`GSA Auctions API response had no "Results" array`)
    }

    const items: RawItem[] = []
    let skippedIrrelevant = 0

    for (const entry of results) {
      if (!entry || typeof entry !== "object") continue
      const lot = entry as Record<string, unknown>

      const itemName = str(lot.itemName)
      const description = stripHtml(str(lot.lotInfo))

      if (!isAgEquipment([itemName, description].filter(Boolean).join(" "))) {
        skippedIrrelevant += 1
        continue
      }

      const saleNo = str(lot.saleNo)
      const lotNo = str(lot.lotNo)
      if (!saleNo || !lotNo) continue // can't build a stable id without both

      items.push({
        external_id: `${saleNo}-${lotNo}`,
        title: itemName,
        description,
        location_city: str(lot.propertyCity),
        location_state: str(lot.propertyState),
        // GSA's own zip field has a known server-side bug concatenating a
        // literal "null" onto some values (e.g. "62703null"); parseInteger-
        // style validation elsewhere in the pipeline isn't applied to zip
        // (it's stored as free text), so this is cleaned up here instead.
        location_zip: str(lot.propertyZip)?.replace(/null$/, "") || undefined,
        auction_company: "GSA Auctions",
        auction_end_date: str(lot.aucEndDt),
        current_bid: str(lot.highBidAmount),
        // lot.imageURL is NOT a usable public image: it 401s with "Token
        // expired or invalid, please login again" even when authenticated
        // with the same api.data.gov key that successfully reads /auctions.
        // It's an internal PPMS endpoint that needs a logged-in GSA session,
        // which the public API has no mechanism to grant a third party. GSA's
        // own API response exposes a URL it doesn't actually make public —
        // confirmed against the live endpoint, not assumed. Omitted entirely
        // rather than stored and left to 401 in the browser: a listing with
        // no real photo should say so, not show a broken image.
        original_url: str(lot.itemDescURL),
      })
    }

    if (skippedIrrelevant > 0) {
      console.log(
        `[gsa-auctions] skipped ${skippedIrrelevant} of ${results.length} lots as not ag/heavy equipment (source: ${source.name})`
      )
    }

    return { items, truncated: false }
  },
}

/**
 * Purpose-built for GSA, not a reuse of normalize.ts's CATEGORY_PATTERNS.
 * Those patterns classify an item already known to be ag equipment into one
 * of 7 categories, and include single generic words like "disc", "header",
 * and "plow" that are safe in that context (every candidate is already a
 * tractor-adjacent listing) but produce false positives against *all*
 * federal surplus — a pickup truck's "single disc CD player" matched
 * "tillage", a trade-show display's "arch top header" matched "combine".
 * Detecting ag equipment out of a universe of office furniture, electronics
 * and random vehicles is a different, harder problem and needs either an
 * unambiguous multi-word phrase or a named ag-equipment manufacturer —
 * never a bare generic word.
 */
const EQUIPMENT_PHRASES =
  /\b(tractor|combine harvester|round baler|square baler|hay baler|disc harrow|field cultivator|skid[\s-]?steer|grain drill|air seeder|forage harvester|windrower|swather|manure spreader|grain cart|planter|cotton picker|silage chopper)\b/i

// Two brands deliberately excluded despite being real tractor makers:
// "Challenger" (AGCO's brand) collides with the Dodge Challenger, a car GSA
// plausibly auctions as seized/surplus; "Versatile" collides with the common
// English adjective and matched a stretcher chair, a microwave, and a
// dosimeter reader in testing ("versatile positioning", "versatile
// operation", ...). Both brands' equipment will usually also say "AGCO" or
// "tractor", already covered elsewhere in this pattern.
const AG_MAKES =
  /\b(john deere|kubota|case\s?ih|new holland|massey ferguson|fendt|claas|international harvester|allis[\s-]?chalmers|mccormick|deutz(?:-?fahr)?|same tractor|steiger|landini|valtra|kinze|great plains|vermeer|bush ?hog|land ?pride|krone|hesston|gleaner|agco)\b/i

function isAgEquipment(text: string): boolean {
  // Pickup instructions routinely mention a "tractor trailer size truck",
  // which once let a printer lot through as farm equipment.
  const cleaned = text.replace(LOGISTICS_NOISE, " ")
  return EQUIPMENT_PHRASES.test(cleaned) || AG_MAKES.test(cleaned)
}

function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

/** GSA's lotInfo field is rich HTML (headings, lists), not plain text —
 *  stripped to text so it renders correctly through the rest of the pipeline,
 *  which treats description as plain text everywhere else. */
function stripHtml(value: string | undefined): string | undefined {
  if (!value) return undefined
  const text = value
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim()
  return text || undefined
}
