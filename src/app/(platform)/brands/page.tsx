import { ArrowRight, Tractor } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { getFilterFacets, searchListings } from "@/lib/listings/queries"
import { EQUIPMENT_CATEGORIES, slugify } from "@/lib/seo/slug"

export const metadata: Metadata = {
  title: "Tractor Brands at Auction — Browse by Make | TractorAuction.com",
  description:
    "Browse live tractor auctions by manufacturer. John Deere, Case IH, Kubota, New Holland, Fendt, Massey Ferguson and more, from every major auction site.",
  alternates: { canonical: "/brands" },
}

export default async function BrandsPage() {
  const facets = await getFilterFacets()

  // Counting per make keeps the index honest: a brand with nothing live says so
  // rather than sending the visitor to an empty landing page.
  const counts = await Promise.all(
    facets.makes.map(async (make) => {
      const { total } = await searchListings({ make }, 1, 1)
      return { make, total }
    })
  )

  const ranked = counts.sort((a, b) => b.total - a.total || a.make.localeCompare(b.make))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Browse by brand</h1>
        <p className="max-w-2xl text-muted-foreground">
          Every manufacturer with live auctions on TractorAuction.com. Pick a brand to see
          what is currently open, compare hours and horsepower across sellers, then bid on
          the auction company&apos;s own site.
        </p>
      </header>

      {ranked.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <Tractor className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No brands listed yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Brands appear here as auction sources sync their listings.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map(({ make, total }) => (
            <Link
              key={make}
              href={`/brand/${slugify(make)}`}
              className="group flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Tractor className="size-5" strokeWidth={1.5} />
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{make}</span>
                  <span className="text-xs text-muted-foreground">
                    {total} live {total === 1 ? "auction" : "auctions"}
                  </span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-lg font-semibold text-foreground">Browse by equipment type</h2>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
