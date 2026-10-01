import { fetchFeed } from "../fetch"
import { readPath } from "../normalize"
import type { Connector, ConnectorContext, RawItem } from "../types"

/**
 * Authorized REST/JSON feeds. Covers the `api` integration type, which is the
 * shape most auction platforms hand a partner once a data agreement is signed.
 *
 * Nested objects are flattened to dotted keys ("location.state"), so a field map
 * can point at anything in the payload without this connector knowing the schema.
 */
export const jsonApiConnector: Connector = {
  name: "json-api",

  async fetchItems({ source, config, deadline }: ConnectorContext) {
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
      headers[config.authHeaderName ?? "authorization"] = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`
    }

    const items: RawItem[] = []
    const maxPages = Math.max(1, config.maxPages ?? 20)
    let truncated = false

    for (let page = 0; page < maxPages; page += 1) {
      if (Date.now() > deadline) {
        truncated = true
        break
      }

      const target = new URL(url)
      if (config.pageParam) {
        target.searchParams.set(config.pageParam, String(page + 1))
        if (config.pageSize) {
          target.searchParams.set(config.pageSizeParam ?? "limit", String(config.pageSize))
        }
      }

      const body = await fetchFeed(target.toString(), { headers })

      let parsed: unknown
      try {
        parsed = JSON.parse(body)
      } catch {
        throw new Error(`feed at ${target.toString()} did not return valid JSON`)
      }

      const container = config.itemsPath ? readPath(parsed, config.itemsPath) : parsed
      if (!Array.isArray(container)) {
        throw new Error(
          config.itemsPath
            ? `itemsPath "${config.itemsPath}" did not resolve to an array`
            : `feed did not return an array; set itemsPath to the array's location`
        )
      }

      for (const entry of container) {
        if (entry && typeof entry === "object") items.push(flatten(entry as Record<string, unknown>))
      }

      // A short page means the feed is exhausted, and an unpaged feed is one page.
      if (!config.pageParam) break
      if (config.pageSize && container.length < config.pageSize) break
      if (container.length === 0) break

      if (page === maxPages - 1) truncated = true
    }

    return { items, truncated }
  },
}

/** { a: { b: 1 }, c: [2,3] } -> { "a.b": "1", c: "2,3" } */
function flatten(input: Record<string, unknown>, prefix = "", depth = 0): RawItem {
  const output: RawItem = {}
  if (depth > 6) return output

  for (const [key, value] of Object.entries(input)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (value === null || value === undefined) continue

    if (Array.isArray(value)) {
      // Arrays of scalars join (images, tags); arrays of objects also expose
      // their first entry's fields, which is how most feeds nest a photo list.
      const scalars = value.filter((item) => typeof item !== "object" || item === null)
      if (scalars.length === value.length) {
        output[path] = value.map(String).join(",")
      } else {
        output[path] = value
          .map((item) =>
            item && typeof item === "object"
              ? String(
                  (item as Record<string, unknown>).url ??
                    (item as Record<string, unknown>).src ??
                    ""
                )
              : String(item)
          )
          .filter(Boolean)
          .join(",")
      }
      continue
    }

    if (typeof value === "object") {
      Object.assign(output, flatten(value as Record<string, unknown>, path, depth + 1))
      continue
    }

    output[path] = String(value)
  }

  return output
}
