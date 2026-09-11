import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { landingFacts, LandingPage } from "@/components/listing/landing-page"
import { getFilterFacets, searchListings } from "@/lib/listings/queries"
import { EQUIPMENT_CATEGORIES, findCategory, slugify } from "@/lib/seo/slug"

export async function generateMetadata(
  props: PageProps<"/category/[category]">
): Promise<Metadata> {
  const { category: slug } = await props.params
  const category = findCategory(slug)

  if (!category) return { title: "Category not found — TractorAuction.com" }

  return {
    title: `${category.label} at Auction — Used Farm Equipment | TractorAuction.com`,
    description: `Search live ${category.label.toLowerCase()} auctions from every major agricultural auction site, with hours, horsepower and current bids in one place.`,
    alternates: { canonical: `/category/${category.slug}` },
  }
}

export default async function CategoryPage(props: PageProps<"/category/[category]">) {
  const { category: slug } = await props.params
  const category = findCategory(slug)

  if (!category) notFound()

  const [{ listings }, facets] = await Promise.all([
    searchListings({ equipment_category: category.value, sort_by: "ending_soon" }, 1, 24),
    getFilterFacets(),
  ])

  const related = [
    ...EQUIPMENT_CATEGORIES.filter((other) => other.slug !== category.slug).map((other) => ({
      href: `/category/${other.slug}`,
      label: other.label,
    })),
    ...facets.makes.slice(0, 6).map((make) => ({
      href: `/brand/${slugify(make)}`,
      label: `${make} auctions`,
    })),
  ]

  return (
    <LandingPage
      title={`${category.label} at Auction`}
      intro={`Every live ${category.label.toLowerCase()} auction we track, aggregated from all of our sources. Filter by year, hours and location, then bid on the original auction site.`}
      listings={listings}
      facts={landingFacts(listings)}
      searchHref={`/search?category=${encodeURIComponent(category.value)}`}
      related={related}
      relatedTitle="Browse other equipment"
    />
  )
}
