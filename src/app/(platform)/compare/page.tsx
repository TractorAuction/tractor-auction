import { GitCompareArrows } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { CompareTable } from "@/components/listing/compare-table"
import { getListingsByIds } from "@/lib/listings/queries"

export const metadata: Metadata = {
  title: "Compare Tractors — TractorAuction.com",
  description: "Compare specs, hours, and auction details side by side.",
  robots: { index: false }, // the id list is per-visitor, not a page worth indexing
}

/**
 * The id list in the URL *is* the share mechanism — copy the link, send it,
 * and whoever opens it sees the same comparison. No separate share feature,
 * no server-side state for an anonymous comparison.
 */
export default async function ComparePage(props: PageProps<"/compare">) {
  const params = await props.searchParams
  const raw = params.ids
  const ids = (Array.isArray(raw) ? raw[0] : raw)?.split(",").filter(Boolean) ?? []

  const listings = ids.length > 0 ? await getListingsByIds(ids.slice(0, 4)) : []

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">Compare tractors</h1>
        <p className="text-sm text-muted-foreground">
          Side-by-side specs for up to 4 listings. This link is shareable — anyone who
          opens it sees the same comparison.
        </p>
      </header>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <GitCompareArrows className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Nothing to compare yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Use the compare icon on a listing card to add it here — select at least 2 to
            see them side by side.
          </p>
          <Link href="/search" className="text-sm font-medium text-primary hover:underline">
            Browse listings
          </Link>
        </div>
      ) : (
        <CompareTable listings={listings} />
      )}
    </div>
  )
}
