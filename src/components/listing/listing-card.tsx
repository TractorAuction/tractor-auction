import { Clock, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { formatCurrency, formatLocation, formatRelativeTime, formatTimeLeft } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Listing } from "@/types"

import { CompareToggle } from "./compare-toggle"
import { ListingImagePlaceholder } from "./listing-image-placeholder"

export function ListingCard({ listing }: { listing: Listing }) {
  const location = formatLocation(listing.location_city, listing.location_state)
  const specs = [
    listing.year ? String(listing.year) : null,
    listing.hours ? `${listing.hours.toLocaleString()} hrs` : null,
    listing.horsepower ? `${listing.horsepower} HP` : null,
  ].filter(Boolean)

  const bid = formatCurrency(listing.current_bid)
  const title = listing.title ?? [listing.year, listing.make, listing.model].filter(Boolean).join(" ")
  const cover = listing.images[0]
  const updated = formatRelativeTime(listing.last_synced_at ?? listing.updated_at)
  const timeLeft = formatTimeLeft(listing.auction_end_date)

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md",
        // Paid and featured placements get a coloured frame so they read as
        // premium at a glance; the text label inside still says what they are.
        listing.is_sponsored
          ? "border-amber-400/70 ring-1 ring-amber-400/40"
          : listing.is_featured
            ? "border-primary/50 ring-1 ring-primary/30"
            : "border-border"
      )}
    >
      {/* Without a photo there is nothing to look at, so on single-column
          phones the placeholder is short; from sm up every card is 4:3 so the
          grid rows stay even. */}
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          cover ? "aspect-[4/3]" : "aspect-[5/2] sm:aspect-[4/3]"
        )}
      >
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

        <CompareToggle
          item={{ id: listing.id, title, image: cover }}
          className="absolute right-2 top-2 z-10"
        />

        {/* Only ever the source's own photo. A listing with no photo shows a
            neutral silhouette rather than borrowing a stock tractor, which
            would misrepresent the machine someone is about to bid on. */}
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <ListingImagePlaceholder category={listing.equipment_category} />
        )}

        {listing.images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded bg-foreground/70 px-1.5 py-0.5 text-[11px] font-medium text-background backdrop-blur-sm">
            {listing.images.length} photos
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {title}
          </h3>
          {specs.length > 0 && <p className="text-xs text-muted-foreground">{specs.join(" · ")}</p>}
          {location && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {bid ? "Current bid" : "Bidding"}
            </span>
            <span className={cn("font-semibold", bid ? "text-lg text-primary" : "text-sm text-muted-foreground")}>
              {bid ?? "No bids yet"}
            </span>
          </div>
          {timeLeft && (
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                timeLeft.urgent
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Clock className="size-3" />
              {timeLeft.label}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
          {listing.source?.name && (
            <span className="truncate rounded border border-border px-1.5 py-0.5 font-medium text-foreground/80">
              {listing.source.name}
            </span>
          )}
          {updated && <span className="shrink-0">Updated {updated}</span>}
        </div>
      </div>
    </Link>
  )
}
