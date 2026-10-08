"use client"

import { Check, Share2, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, formatLocation } from "@/lib/format"
import { slugify } from "@/lib/seo/slug"
import type { Listing } from "@/types"

import { ListingImagePlaceholder } from "./listing-image-placeholder"

/** One row per attribute, each listing's value read off the same field. */
const ROWS: Array<{ label: string; value: (listing: Listing) => React.ReactNode }> = [
  { label: "Make", value: (l) => l.make ?? "—" },
  { label: "Model", value: (l) => l.model ?? "—" },
  { label: "Year", value: (l) => l.year ?? "—" },
  { label: "Horsepower", value: (l) => (l.horsepower ? `${l.horsepower} HP` : "—") },
  { label: "Hours", value: (l) => l.hours?.toLocaleString() ?? "—" },
  { label: "Condition", value: (l) => l.condition ?? "—" },
  { label: "Drive type", value: (l) => l.drive_type ?? "—" },
  { label: "Current bid", value: (l) => formatCurrency(l.current_bid) ?? "—" },
  { label: "Buy it now", value: (l) => formatCurrency(l.buy_it_now_price) ?? "No" },
  { label: "Location", value: (l) => formatLocation(l.location_city, l.location_state) ?? "—" },
  { label: "Auction source", value: (l) => l.source?.name ?? "—" },
  { label: "Auction ends", value: (l) => formatDate(l.auction_end_date) ?? "—" },
]

/**
 * Client component so each column can drop itself from the comparison (and
 * from the shared localStorage selection, via useCompare) without a full
 * page reload — removing the last two collapses straight to the empty state.
 */
export function CompareTable({ listings }: { listings: Listing[] }) {
  const router = useRouter()

  function removeFrom(id: string) {
    const remaining = listings.filter((listing) => listing.id !== id)
    const params = remaining.length > 0 ? `?ids=${remaining.map((l) => l.id).join(",")}` : ""
    router.push(`/compare${params}`)
  }

  const [copied, setCopied] = useState(false)

  /** The URL already encodes the comparison; sharing is handing it over. */
  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tractor comparison", url })
        return
      } catch {
        // Share sheet dismissed; fall through to copying the link.
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
    <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={share}>
        {copied ? <Check className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
        {copied ? "Link copied" : "Share comparison"}
      </Button>
    </div>
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th scope="col" className="w-36 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Listing
            </th>
            {listings.map((listing) => {
              const title =
                listing.title ?? [listing.year, listing.make, listing.model].filter(Boolean).join(" ")
              const cover = listing.images[0]

              return (
                <th key={listing.id} scope="col" className="px-3 py-2.5 align-top font-normal">
                  <div className="flex flex-col gap-2">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
                      {cover ? (
                        <Image src={cover} alt={title} fill sizes="200px" className="object-cover" />
                      ) : (
                        <ListingImagePlaceholder iconClassName="size-8" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFrom(listing.id)}
                        aria-label={`Remove ${title} from comparison`}
                        className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <Link
                      href={`/listing/${listing.id}`}
                      className="text-left text-sm font-semibold leading-tight text-foreground hover:text-primary hover:underline"
                    >
                      {title}
                    </Link>
                    {listing.make && (
                      <Link
                        href={`/brand/${slugify(listing.make)}`}
                        className="w-fit text-xs text-muted-foreground hover:text-primary hover:underline"
                      >
                        More {listing.make}
                      </Link>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-border last:border-0">
              {/* Pinned so the label stays visible while a phone scrolls sideways. */}
              <th
                scope="row"
                className="sticky left-0 z-10 bg-background px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {row.label}
              </th>
              {listings.map((listing) => (
                <td key={listing.id} className="px-3 py-2.5 text-foreground">
                  {row.value(listing)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              &nbsp;
            </th>
            {listings.map((listing) => (
              <td key={listing.id} className="px-3 py-3">
                <a
                  href={`/api/click?listingId=${listing.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  View auction
                </a>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  )
}
