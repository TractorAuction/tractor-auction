import { SlidersHorizontal } from "lucide-react"
import type { Metadata } from "next"
import { Suspense } from "react"

import { ImpressionTracker } from "@/components/listing/impression-tracker"
import { ListingCard } from "@/components/listing/listing-card"
import { ListingGrid } from "@/components/listing/listing-grid"
import { Filters } from "@/components/search/filters"
import { Pagination } from "@/components/search/pagination"
import { SortSelect } from "@/components/search/sort-select"
import {
  buildSearchParams,
  hasActiveFilters,
  parseFilters,
  parsePage,
} from "@/lib/listings/filters"
import { getFeaturedSource, getPromotedListings, promotedIds } from "@/lib/listings/promotions"
import { getFilterFacets, searchListings } from "@/lib/listings/queries"

export const metadata: Metadata = {
  title: "Search Tractor Auctions — TractorAuction.com",
  description:
    "Search active tractor and agricultural equipment auctions from every major auction site in one place.",
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col overflow-hidden rounded-lg border border-border">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="flex flex-col gap-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function SearchPage(props: PageProps<"/search">) {
  const rawParams = await props.searchParams
  const filters = parseFilters(rawParams)
  const page = parsePage(rawParams)

  // Promoted slots only appear on the first page — pushing paid rows onto every
  // page would bill the advertiser repeatedly for the same search.
  const [{ listings, total, pageSize }, facets, promoted, featuredSource] = await Promise.all([
    searchListings(filters, page),
    getFilterFacets(),
    page === 1 ? getPromotedListings(filters, 3) : Promise.resolve([]),
    getFeaturedSource(),
  ])

  const promotedSet = promotedIds(promoted)
  // Organic results never repeat a listing already shown in the promoted strip.
  const organic = listings.filter((listing) => !promotedSet.has(listing.id))

  const sort = filters.sort_by ?? "ending_soon"
  const filtered = hasActiveFilters(filters)
  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastResult = Math.min(page * pageSize, total)

  const impressionIds = [
    ...promoted.map((slot) => slot.placementId),
    featuredSource?.placementId,
  ].filter((id): id is string => Boolean(id))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <ImpressionTracker placementIds={impressionIds} />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">
          {filters.query ? `Results for “${filters.query}”` : "Tractor Auctions"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No matching auctions"
            : `Showing ${firstResult}–${lastResult} of ${total.toLocaleString()} auctions`}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:w-64 lg:shrink-0">
          <details open className="rounded-lg border border-border p-4 lg:border-0 lg:p-0 [&>summary]:lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="size-4" /> Filters
            </summary>
            <div className="mt-4 lg:mt-0">
              <Suspense fallback={null}>
                <Filters facets={facets} />
              </Suspense>
            </div>
          </details>

          {featuredSource && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sponsored auction house
              </span>
              <span className="font-semibold text-foreground">{featuredSource.name}</span>
              {featuredSource.description && (
                <p className="text-xs text-muted-foreground">{featuredSource.description}</p>
              )}
              <a
                href={featuredSource.website_url}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="text-xs font-medium text-primary hover:underline"
              >
                Visit {featuredSource.name}
              </a>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex items-center justify-end">
            <Suspense fallback={null}>
              <SortSelect value={sort} />
            </Suspense>
          </div>

          {promoted.length > 0 && (
            <section className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Promoted auctions</h2>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Paid placement
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {promoted.map((slot) => (
                  <ListingCard key={slot.listing.id} listing={slot.listing} />
                ))}
              </div>
            </section>
          )}

          <Suspense fallback={<ResultsSkeleton />}>
            {organic.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
                <p className="text-sm font-medium text-foreground">No auctions match your search</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {filtered
                    ? "Try widening your filters, or clear them to see everything currently listed."
                    : "New listings are added as each source syncs. Check back shortly."}
                </p>
              </div>
            ) : (
              <ListingGrid listings={organic} />
            )}
          </Suspense>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            searchParams={buildSearchParams(filters)}
          />
        </div>
      </div>
    </div>
  )
}
