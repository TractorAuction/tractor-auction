import { Tractor } from "lucide-react"
import Link from "next/link"

import { formatCurrency, formatDate, formatLocation } from "@/lib/format"
import type { Listing } from "@/types"

export function ListingCard({ listing }: { listing: Listing }) {
  const location = formatLocation(listing.location_city, listing.location_state)
  const specs = [
    listing.horsepower ? `${listing.horsepower} HP` : null,
    listing.hours ? `${listing.hours.toLocaleString()} HRS` : null,
  ].filter(Boolean)

  const bid = formatCurrency(listing.current_bid)

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* Paid placement is labelled before anything else on the card, and the
            label says "Sponsored" in plain words — never a colour or icon alone. */}
        <div className="absolute left-2 top-2 z-10 flex gap-1">
          {listing.is_sponsored && (
            <span className="rounded bg-amber-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              Sponsored
            </span>
          )}
          {listing.is_featured && (
            <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
              Featured
            </span>
          )}
        </div>

        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground/40 transition-transform group-hover:scale-105">
          <Tractor className="size-12" strokeWidth={1.25} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{listing.title}</h3>
        {specs.length > 0 && (
          <p className="text-xs text-muted-foreground">{specs.join(" • ")}</p>
        )}
        {location && <p className="text-xs text-muted-foreground">{location}</p>}
        {bid && <p className="mt-0.5 text-sm font-semibold text-primary">{bid}</p>}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
          <span className="font-medium text-muted-foreground">{listing.source?.name}</span>
          <span className="text-muted-foreground">{formatDate(listing.auction_end_date)}</span>
        </div>
      </div>
    </Link>
  )
}
