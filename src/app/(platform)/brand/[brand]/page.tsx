import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { landingFacts, LandingPage } from "@/components/listing/landing-page"
import { getFilterFacets, searchListings } from "@/lib/listings/queries"
import { matchSlug, slugify, stateName } from "@/lib/seo/slug"

async function resolveBrand(slug: string) {
  const { makes } = await getFilterFacets()
  return matchSlug(slug, makes)
}

export async function generateMetadata(
  props: PageProps<"/brand/[brand]">
): Promise<Metadata> {
  const { brand } = await props.params
  const make = await resolveBrand(brand)

  if (!make) return { title: "Brand not found — TractorAuction.com" }

  return {
    title: `${make} Tractor Auctions — Used ${make} Tractors for Sale | TractorAuction.com`,
    description: `Browse live ${make} tractor auctions from every major auction site. Compare year, hours, horsepower and current bids, then bid on the original auction site.`,
    alternates: { canonical: `/brand/${slugify(make)}` },
  }
}

export default async function BrandPage(props: PageProps<"/brand/[brand]">) {
  const { brand } = await props.params
  const make = await resolveBrand(brand)

  if (!make) notFound()

  const [{ listings }, facets] = await Promise.all([
    searchListings({ make, sort_by: "ending_soon" }, 1, 24),
    getFilterFacets(),
  ])

  // Models and states are drawn from this brand's own live listings, so every
  // cross-link points at a page that actually has results.
  const models = Array.from(
    new Set(listings.map((listing) => listing.model).filter((model): model is string => Boolean(model)))
  ).sort()

  const states = Array.from(
    new Set(
      listings
        .map((listing) => listing.location_state)
        .filter((state): state is string => Boolean(state))
    )
  ).sort()

  const related = [
    ...models.slice(0, 10).map((model) => ({
      href: `/brand/${slugify(make)}/${slugify(model)}`,
      label: `${make} ${model}`,
    })),
    ...states.slice(0, 6).map((state) => ({
      href: `/location/${slugify(stateName(state) ?? state)}`,
      label: `Auctions in ${stateName(state)}`,
    })),
    ...facets.makes
      .filter((other) => other !== make)
      .slice(0, 6)
      .map((other) => ({ href: `/brand/${slugify(other)}`, label: other })),
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${make} Tractor Auctions`,
    description: `Live ${make} tractor auctions aggregated from major auction sites.`,
    numberOfItems: listings.length,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage
        title={`${make} Tractor Auctions`}
        intro={`Every live ${make} auction we track, from all of our auction sources in one place. Compare hours, horsepower and current bids side by side, then click through to bid on the auction company's own site — we never take a cut.`}
        listings={listings}
        facts={landingFacts(listings)}
        searchHref={`/search?make=${encodeURIComponent(make)}`}
        related={related}
        relatedTitle={`Popular ${make} searches`}
      />
    </>
  )
}
