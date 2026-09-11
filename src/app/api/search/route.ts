import { NextRequest, NextResponse } from "next/server"

import { parseFilters, parsePage } from "@/lib/listings/filters"
import { DEFAULT_PAGE_SIZE, searchListings } from "@/lib/listings/queries"
import type { ApiResponse, SearchResult } from "@/types"

const MAX_PAGE_SIZE = 100

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SearchResult>>> {
  const params = request.nextUrl.searchParams

  const requestedSize = Number(params.get("pageSize"))
  const pageSize =
    Number.isFinite(requestedSize) && requestedSize > 0
      ? Math.min(Math.trunc(requestedSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE

  try {
    const result = await searchListings(parseFilters(params), parsePage(params), pageSize)
    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error("[api/search]", error)
    return NextResponse.json(
      { data: null, error: "Failed to search listings" },
      { status: 500 }
    )
  }
}
