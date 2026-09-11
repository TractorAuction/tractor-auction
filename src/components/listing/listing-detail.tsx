import {
  Calendar,
  ChevronRight,
  Cog,
  ExternalLink,
  Gauge,
  Hash,
  MapPin,
  ShieldCheck,
  Tag,
  Timer,
  Tractor,
} from "lucide-react"
import Link from "next/link"

import { AuctionCountdown } from "@/components/listing/auction-countdown"
import { WatchlistButton } from "@/components/account/watchlist-button"
import { ListingActions } from "@/components/listing/listing-actions"
import { ListingGallery } from "@/components/listing/listing-gallery"
import { Button } from "@/components/ui/button"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatLocation,
  formatNumber,
} from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Listing } from "@/types"

const statusLabels: Record<Listing["status"], string> = {
  active: "Auction Live",
  expired: "Auction Ended",
  sold: "Sold",
}

export function ListingDetail({
  listing,
  similar,
}: {
  listing: Listing
  similar?: React.ReactNode
}) {
  const title = listing.title ?? [listing.year, listing.make, listing.model].filter(Boolean).join(" ")
  const location = formatLocation(listing.location_city, listing.location_state)
  // The destination lives on the listing row; the tracker resolves it server side.
  const clickUrl = `/api/click?listingId=${encodeURIComponent(listing.id)}`

  const quickSpecs = [
    { icon: Gauge, label: "Horsepower", value: listing.horsepower ? `${listing.horsepower} HP` : null },
    { icon: Timer, label: "Hours", value: formatNumber(listing.hours) },
    { icon: Calendar, label: "Year", value: listing.year ? String(listing.year) : null },
    { icon: Cog, label: "Drive Type", value: listing.drive_type },
  ]

  const fullSpecs = [
    { label: "Make", value: listing.make },
    { label: "Model", value: listing.model },
    { label: "Year", value: listing.year ? String(listing.year) : null },
    { label: "Category", value: listing.equipment_category },
    { label: "Horsepower", value: listing.horsepower ? `${listing.horsepower} HP` : null },
    { label: "Hours", value: formatNumber(listing.hours) },
    { label: "Drive Type", value: listing.drive_type },
    { label: "Serial Number", value: listing.serial_number },
    { label: "Location", value: location },
    { label: "Listing ID", value: listing.external_id ?? listing.id },
  ].filter((spec) => spec.value)

  return (
    <div className="flex flex-1 flex-col">
      <nav aria-label="Breadcrumb" className="border-b border-border bg-muted/40 px-6 py-3">
        <ol className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Crumb href="/">Home</Crumb>
          <Separator />
          <Crumb href="/search">Auctions</Crumb>
          {listing.make && (
            <>
              <Separator />
              <Crumb href={`/brand/${slug(listing.make)}`}>{listing.make}</Crumb>
            </>
          )}
          <Separator />
          <li className="font-medium text-foreground" aria-current="page">
            {title}
          </li>
        </ol>
      </nav>

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={listing.status} />
              {listing.is_featured && <Badge tone="primary">Featured</Badge>}
              {listing.is_sponsored && <Badge tone="amber">Sponsored</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Tag className="size-4" /> {listing.equipment_category}
              </span>
              {listing.external_id && (
                <span className="flex items-center gap-1.5">
                  <Hash className="size-4" /> {listing.external_id}
                </span>
              )}
            </div>
          </header>

          <ListingGallery images={listing.images} title={title} />

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickSpecs.map((spec) => (
              <div
                key={spec.label}
                className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <spec.icon className="size-3.5" /> {spec.label}
                </span>
                <span className="text-base font-semibold text-foreground">
                  {spec.value ?? "—"}
                </span>
              </div>
            ))}
          </section>

          {listing.description && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {listing.description}
              </p>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">Specifications</h2>
            <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-border sm:grid-cols-2">
              {fullSpecs.map((spec, index) => (
                <div
                  key={spec.label}
                  className={cn(
                    "flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 text-sm last:border-b-0",
                    index % 2 === 0 && "bg-muted/40",
                    "sm:[&:nth-last-child(2)]:border-b-0"
                  )}
                >
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="text-right font-medium text-foreground">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              TractorAuction.com aggregates listings from third party auction sites. All bidding,
              payment, inspection, and transport are handled by{" "}
              <span className="font-medium text-foreground">
                {listing.source?.name ?? "the auction company"}
              </span>
              . Verify condition, terms, and fees on the original listing before bidding.
            </p>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <SourceRow source={listing.source} />

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {listing.status === "sold" ? "Sold for" : "Current bid"}
              </span>
              <span className="text-3xl font-bold text-foreground">
                {formatCurrency(listing.current_bid) ?? "No bids yet"}
              </span>
              {listing.buy_it_now_price && (
                <span className="text-sm text-muted-foreground">
                  Buy it now{" "}
                  <span className="font-semibold text-primary">
                    {formatCurrency(listing.buy_it_now_price)}
                  </span>
                </span>
              )}
            </div>

            {listing.auction_end_date && listing.status === "active" && (
              <AuctionCountdown endDate={listing.auction_end_date} />
            )}

            {listing.auction_end_date && (
              <div className="flex items-start justify-between gap-3 border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">
                  {listing.status === "active" ? "Auction ends" : "Auction ended"}
                </span>
                <span className="text-right font-medium text-foreground">
                  {formatDateTime(listing.auction_end_date)}
                </span>
              </div>
            )}

            <Button
              size="lg"
              nativeButton={false}
              className="h-11 w-full text-base"
              render={
                <a href={clickUrl} target="_blank" rel="noopener noreferrer nofollow sponsored" />
              }
            >
              View Auction on {listing.source?.name ?? "Source Site"}
              <ExternalLink className="size-4" />
            </Button>
            <p className="-mt-2 text-center text-[11px] text-muted-foreground">
              Opens the original listing. Bidding happens on the auction site.
            </p>

            <ListingActions
              title={title}
              saveSlot={<WatchlistButton listingId={listing.id} />}
            />
          </div>

          {listing.source && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground">About this source</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {listing.source.name} is one of the auction platforms we aggregate. Listing data was
                last synced {formatDate(listing.updated_at) ?? "recently"}.
              </p>
              <Link
                href={`/search?source_id=${encodeURIComponent(listing.source.id)}`}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                See all {listing.source.name} auctions <ChevronRight className="size-3.5" />
              </Link>
            </div>
          )}
        </aside>
      </div>

      {similar}
    </div>
  )
}

function Crumb({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-foreground hover:underline">
        {children}
      </Link>
    </li>
  )
}

function Separator() {
  return (
    <li aria-hidden className="text-muted-foreground/50">
      <ChevronRight className="size-3" />
    </li>
  )
}

function Badge({ tone, children }: { tone: "primary" | "amber"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
      )}
    >
      {children}
    </span>
  )
}

function StatusBadge({ status }: { status: Listing["status"] }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        status === "active"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "active" ? "bg-primary" : "bg-muted-foreground/60"
        )}
      />
      {statusLabels[status]}
    </span>
  )
}

function SourceRow({ source }: { source?: Listing["source"] }) {
  if (!source) return null
  return (
    <div className="flex items-center gap-2 border-b border-border pb-3">
      <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Tractor className="size-4" strokeWidth={1.5} />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-muted-foreground">Listed on</span>
        <span className="text-sm font-semibold text-foreground">{source.name}</span>
      </div>
    </div>
  )
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}
