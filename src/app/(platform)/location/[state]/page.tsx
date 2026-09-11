import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { landingFacts, LandingPage } from "@/components/listing/landing-page"
import { getFilterFacets, searchListings } from "@/lib/listings/queries"
import { slugify, stateCodeFromSlug, stateName } from "@/lib/seo/slug"

export async function generateMetadata(
  props: PageProps<"/location/[state]">
): Promise<Metadata> {
  const { state: slug } = await props.params
  const code = stateCodeFromSlug(slug)

  if (!code) return { title: "Location not found — TractorAuction.com" }

  const name = stateName(code)

  return {
    title: `Tractor Auctions in ${name} — Farm Equipment for Sale | TractorAuction.com`,
    description: `Find live tractor and farm equipment auctions in ${name}. Compare listings from every major auction site, then bid on the auction company's own site.`,
    alternates: { canonical: `/location/${slugify(name ?? code)}` },
  }
}

export default async function LocationPage(props: PageProps<"/location/[state]">) {
  const { state: slug } = await props.params
  const code = stateCodeFromSlug(slug)

  if (!code) notFound()

  const name = stateName(code) ?? code

  const [{ listings }, facets] = await Promise.all([
    searchListings({ location_state: code, sort_by: "ending_soon" }, 1, 24),
    getFilterFacets(),
  ])

  // Only link to states we actually hold listings for, so the internal links
  // never point at an empty page.
  const related = [
    ...facets.states
      .filter((other) => other !== code)
      .slice(0, 10)
      .map((other) => ({
        href: `/location/${slugify(stateName(other) ?? other)}`,
        label: stateName(other) ?? other,
      })),
    ...facets.makes.slice(0, 6).map((make) => ({
      href: `/brand/${slugify(make)}`,
      label: `${make} auctions`,
    })),
  ]

  return (
    <LandingPage
      title={`Tractor Auctions in ${name}`}
      intro={`Live tractor and farm equipment auctions located in ${name}, aggregated from every auction source we track. Buying close to home keeps transport costs down — these are the lots currently open near you.`}
      listings={listings}
      facts={landingFacts(listings)}
      searchHref={`/search?state=${encodeURIComponent(code)}`}
      related={related}
      relatedTitle="Auctions in other states"
    />
  )
}
