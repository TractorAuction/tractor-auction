import { XMLParser } from "fast-xml-parser"

import { fetchFeed } from "../fetch"
import { readPath } from "../normalize"
import type { Connector, ConnectorContext, RawItem } from "../types"

/**
 * RSS and plain XML feeds — the `rss` and `xml` integration types. Auction
 * houses that publish a listings export most often publish it as one of these.
 *
 * Attributes are exposed with an `@_` prefix, so a field map can read
 * `enclosure.@_url` for an RSS image without special-casing it here.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  // Keeps <item> a single-element array when a feed has exactly one listing,
  // which otherwise silently parses as an object and ingests nothing.
  isArray: (name) => /^(item|entry|listing|lot)$/i.test(name),
})

const ITEM_PATHS = [
  "rss.channel.item",
  "feed.entry",
  "listings.listing",
  "listings.item",
  "items.item",
  "auction.lots.lot",
  "lots.lot",
]

export const xmlFeedConnector: Connector = {
  name: "xml-feed",

  async fetchItems({ source, config }: ConnectorContext) {
    const url = config.url ?? source.api_endpoint
    if (!url) throw new Error(`source ${source.name} has no feed url configured`)

    const headers = { ...(config.headers ?? {}) }
    if (config.authHeaderEnv) {
      const token = process.env[config.authHeaderEnv]
      if (!token) {
        throw new Error(
          `${config.authHeaderEnv} is not set, but ${source.name} needs it to authenticate`
        )
      }
      headers[config.authHeaderName ?? "authorization"] = `Bearer ${token}`
    }

    const body = await fetchFeed(url, { headers })

    let document: unknown
    try {
      document = parser.parse(body)
    } catch (error) {
      throw new Error(
        `feed at ${url} is not parseable XML: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    const container = locateItems(document, config.itemsPath)
    if (!container) {
      throw new Error(
        `could not find listing elements in ${url}. Set itemsPath to their path, ` +
          `e.g. "rss.channel.item".`
      )
    }

    const items = container
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => flattenNode(entry))

    return { items, truncated: false }
  },
}

function locateItems(document: unknown, itemsPath?: string): unknown[] | undefined {
  const candidates = itemsPath ? [itemsPath, ...ITEM_PATHS] : ITEM_PATHS

  for (const path of candidates) {
    const value = readPath(document, path)
    if (Array.isArray(value)) return value
    // A feed with one listing can still parse to a bare object.
    if (value && typeof value === "object") return [value]
  }

  return undefined
}

/**
 * XML text nodes land under "#text" once a tag also carries attributes, so a
 * flattened node exposes both `price` and `price.@_currency`.
 */
function flattenNode(node: Record<string, unknown>, prefix = "", depth = 0): RawItem {
  const output: RawItem = {}
  if (depth > 6) return output

  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (value === null || value === undefined) continue

    if (key === "#text") {
      if (prefix) output[prefix] = String(value)
      continue
    }

    if (Array.isArray(value)) {
      const scalars = value.filter((item) => typeof item !== "object" || item === null)
      if (scalars.length === value.length) {
        output[path] = value.map(String).join(",")
      } else {
        // Repeated <image> elements: collect their text or url attribute.
        output[path] = value
          .map((item) => {
            if (!item || typeof item !== "object") return String(item ?? "")
            const record = item as Record<string, unknown>
            return String(record["#text"] ?? record["@_url"] ?? record["@_href"] ?? "")
          })
          .filter(Boolean)
          .join(",")
      }
      continue
    }

    if (typeof value === "object") {
      Object.assign(output, flattenNode(value as Record<string, unknown>, path, depth + 1))
      continue
    }

    output[path] = String(value)
  }

  return output
}
