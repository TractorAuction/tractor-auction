import { NextResponse } from "next/server"

import { requireIngestSecret } from "@/lib/ingestion/authorize"

/**
 * One-shot connectivity check for the configured Meilisearch credentials.
 *
 * Exists only to answer "are the env vars actually wired up" without ever
 * printing a secret back — it reports shape (set / placeholder / reachable),
 * never the value. Same bearer gate as the other ingest endpoints.
 */
export const dynamic = "force-dynamic"

function describe(name: string): "missing" | "placeholder" | "set" {
  const value = process.env[name]
  if (!value) return "missing"
  if (value.startsWith("your_")) return "placeholder"
  return "set"
}

export async function GET(request: Request) {
  const auth = requireIngestSecret(request)
  if (!auth.ok) {
    return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
  }

  const vars = {
    MEILISEARCH_HOST: describe("MEILISEARCH_HOST"),
    MEILISEARCH_API_KEY: describe("MEILISEARCH_API_KEY"),
    NEXT_PUBLIC_MEILISEARCH_HOST: describe("NEXT_PUBLIC_MEILISEARCH_HOST"),
    NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY: describe("NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY"),
  }

  let connection: { ok: boolean; detail: string } = { ok: false, detail: "not attempted" }

  if (vars.MEILISEARCH_HOST === "set") {
    try {
      const response = await fetch(`${process.env.MEILISEARCH_HOST}/health`, {
        headers: vars.MEILISEARCH_API_KEY === "set"
          ? { authorization: `Bearer ${process.env.MEILISEARCH_API_KEY}` }
          : {},
        signal: AbortSignal.timeout(8000),
      })
      const body = await response.text()
      connection = {
        ok: response.ok,
        detail: `${response.status} ${response.statusText} - ${body.slice(0, 200)}`,
      }
    } catch (error) {
      connection = {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  } else {
    connection = { ok: false, detail: `MEILISEARCH_HOST is ${vars.MEILISEARCH_HOST}` }
  }

  return NextResponse.json({ data: { vars, connection }, error: null })
}
