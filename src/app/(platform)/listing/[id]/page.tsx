import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ListingCard } from "@/components/listing/listing-card"
import { ListingDetail } from "@/components/listing/listing-detail"
import { formatLocation } from "@/lib/format"
import { getListing, getSimilarListings } from "@/lib/listings/queries"
import type { Listing } from "@/types"

function listingTitle(listing: Listing) {
  return (
    listing.title ?? [listing.year, listing.make, listing.model].filter(Boolean).join(" ")
  )
}

export async function generateMetadata(
  props: PageProps<"/listing/[id]">
): Promise<Metadata> {
  const { id } = await props.params
  const listing = await getListing(id)

  if (!listing) {
    return { title: "Listing not found — TractorAuction.com" }
  }

  const title = listingTitle(listing)
  const location = formatLocation(listing.location_city, listing.location_state)
  const description =
    listing.description?.slice(0, 155) ??
    `${title} for auction${location ? ` in ${location}` : ""} on ${listing.source?.name ?? "a partner auction site"}.`

  return {
    title: `${title} — Tractor Auction | TractorAuction.com`,
    description,
    alternates: { canonical: `/listing/${listing.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/listing/${listing.id}`,
      images: listing.images.length > 0 ? listing.images : undefined,
    },
  }
}

export default async function ListingPage(props: PageProps<"/listing/[id]">) {
  const { id } = await props.params
  const listing = await getListing(id)

  if (!listing) notFound()

  const similar = await getSimilarListings(listing)
  const title = listingTitle(listing)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: listing.description,
    category: listing.equipment_category,
    brand: listing.make ? { "@type": "Brand", name: listing.make } : undefined,
    model: listing.model,
    sku: listing.external_id ?? listing.id,
    image: listing.images.length > 0 ? listing.images : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: listing.current_bid,
      url: listing.original_url,
      availability:
        listing.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      seller: listing.source
        ? { "@type": "Organization", name: listing.source.name, url: listing.source.website_url }
        : undefined,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListingDetail
        listing={listing}
        similar={
          similar.length > 0 && (
            <section className="border-t border-border bg-muted/30 px-6 py-10">
              <div className="mx-auto flex max-w-6xl flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Similar Tractors</h2>
                  <Link
                    href={listing.make ? `/search?make=${encodeURIComponent(listing.make)}` : "/search"}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View all auctions <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {similar.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </div>
            </section>
          )
        }
      />
    </>
  )
}
