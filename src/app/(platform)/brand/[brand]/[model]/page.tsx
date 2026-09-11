import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { landingFacts, LandingPage } from "@/components/listing/landing-page"
import { getFilterFacets, searchListings } from "@/lib/listings/queries"
import { matchSlug, slugify } from "@/lib/seo/slug"

/**
 * Resolves both segments together: the model slug is matched against the models
 * that actually exist for this make, so /brand/kubota/8r-340 is a 404 rather
 * than an empty page.
 */
async function resolve(brandSlug: string, modelSlug: string) {
  const { makes } = await getFilterFacets()
  const make = matchSlug(brandSlug, makes)
  if (!make) return null

  const { listings } = await searchListings({ make }, 1, 200)
  const models = Array.from(
    new Set(listings.map((item) => item.model).filter((value): value is string => Boolean(value)))
  )

  const model = matchSlug(modelSlug, models)
  if (!model) return null

  return { make, model, siblingModels: models }
}

export async function generateMetadata(
  props: PageProps<"/brand/[brand]/[model]">
): Promise<Metadata> {
  const { brand, model: modelSlug } = await props.params
  const resolved = await resolve(brand, modelSlug)

  if (!resolved) return { title: "Model not found — TractorAuction.com" }

  const { make, model } = resolved

  return {
    title: `${make} ${model} for Sale at Auction | TractorAuction.com`,
    description: `Current ${make} ${model} auction listings with hours, horsepower and live bids, aggregated from every major auction site.`,
    alternates: { canonical: `/brand/${slugify(make)}/${slugify(model)}` },
  }
}

export default async function BrandModelPage(props: PageProps<"/brand/[brand]/[model]">) {
  const { brand, model: modelSlug } = await props.params
  const resolved = await resolve(brand, modelSlug)

  if (!resolved) notFound()

  const { make, model, siblingModels } = resolved

  const { listings } = await searchListings({ make, model, sort_by: "ending_soon" }, 1, 24)
  const facts = landingFacts(listings)

  const related = [
    { href: `/brand/${slugify(make)}`, label: `All ${make} auctions` },
    ...siblingModels
      .filter((other) => other !== model)
      .slice(0, 10)
      .map((other) => ({
        href: `/brand/${slugify(make)}/${slugify(other)}`,
        label: `${make} ${other}`,
      })),
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${make} ${model}`,
    brand: { "@type": "Brand", name: make },
    model,
    ...(facts.lowestBid !== undefined && listings.length > 0
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: facts.lowestBid,
            highPrice: facts.highestBid,
            offerCount: listings.length,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage
        title={`${make} ${model} Auctions`}
        intro={`Live auction listings for the ${make} ${model}, gathered from every auction source we track. Compare hours and condition across sellers, then bid on the auction company's own site.`}
        listings={listings}
        facts={facts}
        searchHref={`/search?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`}
        related={related}
        relatedTitle={`Other ${make} models`}
      />
    </>
  )
}
