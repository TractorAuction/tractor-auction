import { NextRequest, NextResponse } from "next/server"

import { parseFilters, parsePage } from "@/lib/listings/filters"
import { DEFAULT_PAGE_SIZE, getListing, searchListings } from "@/lib/listings/queries"
import type { ApiResponse, Listing, SearchResult } from "@/types"

const MAX_PAGE_SIZE = 100

/**
 * `?id=` returns a single listing; otherwise the same filter set as /api/search
 * returns a page of listings. Search is kept separate because it will move to
 * Meilisearch, while this route stays a straight read of the listings table.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Listing | SearchResult>>> {
  const params = request.nextUrl.searchParams
  const id = params.get("id")

  try {
    if (id) {
      const listing = await getListing(id)
      if (!listing) {
        return NextResponse.json({ data: null, error: "Listing not found" }, { status: 404 })
      }
      return NextResponse.json({ data: listing, error: null })
    }

    const requestedSize = Number(params.get("pageSize"))
    const pageSize =
      Number.isFinite(requestedSize) && requestedSize > 0
        ? Math.min(Math.trunc(requestedSize), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE

    const result = await searchListings(parseFilters(params), parsePage(params), pageSize)
    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error("[api/listings]", error)
    return NextResponse.json(
      { data: null, error: "Failed to load listings" },
      { status: 500 }
    )
  }
}
