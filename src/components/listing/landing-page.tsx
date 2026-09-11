import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { ListingGrid } from "@/components/listing/listing-grid"
import { formatCurrency } from "@/lib/format"
import type { Listing } from "@/types"

export type LandingFacts = {
  count: number
  lowestBid?: number
  highestBid?: number
  soonestEnd?: string
}

/**
 * Shared shell for the brand / model / category / location landing pages. They
 * differ only in copy and the filter behind them, so the layout lives here and
 * each route supplies its own heading, intro, and cross-links.
 */
export function LandingPage({
  title,
  intro,
  listings,
  facts,
  searchHref,
  related,
  relatedTitle,
}: {
  title: string
  intro: string
  listings: Listing[]
  facts: LandingFacts
  searchHref: string
  related?: { href: string; label: string }[]
  relatedTitle?: string
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="max-w-3xl text-muted-foreground">{intro}</p>

        {facts.count > 0 && (
          <dl className="flex flex-wrap gap-6 rounded-lg border border-border p-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Active auctions
              </dt>
              <dd className="text-xl font-semibold tabular-nums">{facts.count}</dd>
            </div>
            {facts.lowestBid !== undefined && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Current bids from
                </dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {formatCurrency(facts.lowestBid)}
                </dd>
              </div>
            )}
            {facts.highestBid !== undefined && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Up to
                </dt>
                <dd className="text-xl font-semibold tabular-nums">
                  {formatCurrency(facts.highestBid)}
                </dd>
              </div>
            )}
          </dl>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Current auctions</h2>
          <Link
            href={searchHref}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Refine this search <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-14 text-center">
            <p className="text-sm font-medium text-foreground">No active auctions right now</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              New listings arrive as each auction source syncs. Try a broader search in the
              meantime.
            </p>
            <Link href="/search" className="text-sm font-medium text-primary hover:underline">
              Browse all auctions
            </Link>
          </div>
        ) : (
          <ListingGrid listings={listings} />
        )}
      </section>

      {related && related.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-foreground">
            {relatedTitle ?? "Related searches"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/** Summary stats rendered above the grid, computed from the page's own rows. */
export function landingFacts(listings: Listing[]): LandingFacts {
  const bids = listings
    .map((listing) => listing.current_bid)
    .filter((bid): bid is number => typeof bid === "number")

  const ends = listings
    .map((listing) => listing.auction_end_date)
    .filter((date): date is string => Boolean(date))
    .sort()

  return {
    count: listings.length,
    lowestBid: bids.length > 0 ? Math.min(...bids) : undefined,
    highestBid: bids.length > 0 ? Math.max(...bids) : undefined,
    soonestEnd: ends[0],
  }
}
