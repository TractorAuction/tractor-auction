import { fetchFeed } from "../fetch"
import type { Connector, ConnectorContext, RawItem } from "../types"

/**
 * CSV feeds — the `csv`, `ftp` and `google_sheets` integration types, plus the
 * manual exports a partner emails over before a real integration exists. A
 * published Google Sheet works directly: its /export?format=csv URL is the feed.
 */
export const csvFeedConnector: Connector = {
  name: "csv-feed",

  async fetchItems({ source, config }: ConnectorContext) {
    const url = config.url ?? source.api_endpoint
    if (!url) throw new Error(`source ${source.name} has no feed url configured`)

    const body = await fetchFeed(url, { headers: config.headers })
    const rows = parseCsv(body, config.delimiter ?? ",")

    if (rows.length < 2) {
      throw new Error(`feed at ${url} has a header but no data rows`)
    }

    const header = rows[0].map((column) => column.trim())
    const items: RawItem[] = []

    for (const row of rows.slice(1)) {
      // A trailing newline yields one empty cell; that is not a listing.
      if (row.length === 1 && !row[0].trim()) continue

      const item: RawItem = {}
      header.forEach((column, index) => {
        if (!column) return
        const value = row[index]?.trim()
        if (value) item[column] = value
      })
      items.push(item)
    }

    return { items, truncated: false }
  },
}

/**
 * RFC 4180: quoted fields may contain the delimiter, newlines, and doubled
 * quotes. A hand-rolled split on "," corrupts any description containing a
 * comma, which is most of them.
 */
export function parseCsv(input: string, delimiter = ","): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false

  // Strip a UTF-8 BOM, which otherwise becomes part of the first column name.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
      continue
    }

    if (char === delimiter) {
      row.push(field)
      field = ""
      continue
    }

    if (char === "\r") continue

    if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      continue
    }

    field += char
  }

  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
