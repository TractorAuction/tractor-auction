import { ArrowRight, Bell, ClipboardList, Clock, GitCompareArrows, Globe, Search, Tractor, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { ListingCard } from "@/components/listing/listing-card"
import { HeroSearch } from "@/components/search/hero-search"
import { ImpressionTracker } from "@/components/listing/impression-tracker"
import { getHomepagePlacement } from "@/lib/listings/promotions"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  getActiveListingCount,
  getEndingSoon,
  getFeaturedListings,
  getLiveSources,
  getRecentResults,
} from "@/lib/listings/queries"
import { getSearchFacets } from "@/lib/listings/search-index"

const features = [
  {
    icon: Search,
    title: "One Search",
    description: "Search live auctions from multiple sources in one place.",
  },
  {
    icon: Bell,
    title: "Save & Get Alerts",
    description: "Save searches and get notified when new tractors match.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare Tractors",
    description: "Compare specs, hours, and auction details.",
  },
  {
    icon: ClipboardList,
    title: "Auction Results",
    description: "See closing bids from recent auctions.",
  },
]

export default async function Home() {
  const [featured, endingSoon, facets, homepageSlot, activeCount, liveSources, recentResults] =
    await Promise.all([
      getFeaturedListings(4),
      getEndingSoon(4),
      getSearchFacets(),
      getHomepagePlacement(),
      getActiveListingCount(),
      getLiveSources(),
      getRecentResults(4),
    ])

  // Every figure here is read from the database on each request. Nothing on
  // this page may state a number or name a source that the data does not back.
  const stats = [
    {
      icon: Search,
      title: activeCount.toLocaleString("en-US"),
      description: activeCount === 1 ? "Active auction right now" : "Active auctions right now",
    },
    {
      icon: Globe,
      title: `${liveSources.length} ${liveSources.length === 1 ? "Source" : "Sources"}`,
      description: "Searched together in one place.",
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "Find the right tractor faster.",
    },
    {
      icon: TrendingUp,
      title: "Better Decisions",
      description: "Compare listings and closing prices.",
    },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <ImpressionTracker
        placementIds={homepageSlot?.placementId ? [homepageSlot.placementId] : []}
      />
      <section className="relative isolate overflow-hidden px-6 py-24 text-white sm:py-28">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Two scrims rather than one flat overlay: the photo's sky is pale
            exactly where the headline sits, so a left-weighted gradient carries
            the text contrast while the tractor on the right stays visible. The
            second layer tints toward the brand green so the darkening does not
            read as muddy grey. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25"
        />
        <div aria-hidden className="absolute inset-0 bg-[#12301A]/35" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-6">
          <h1 className="max-w-xl text-4xl font-bold leading-tight drop-shadow-md sm:text-5xl">
            Find Tractors. <br /> Win More.
          </h1>
          <p className="max-w-md text-base text-white/90 drop-shadow-sm">
            Search active and recent tractor auctions from multiple auction sites in one
            place.
          </p>
          <HeroSearch makes={facets.makes} states={facets.states} />
        </div>
      </section>

      {liveSources.length > 0 && (
        <section className="border-b border-border bg-muted/40 px-6 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5">
            <p className="text-sm font-medium text-muted-foreground">
              Live listings currently aggregated from
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {liveSources.map((source) =>
                source.logo_url ? (
                  <span key={source.id} className="flex h-9 w-32 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={source.logo_url}
                      alt={source.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </span>
                ) : (
                  <span
                    key={source.id}
                    className="text-lg font-bold tracking-tight text-foreground/70"
                  >
                    {source.name}
                  </span>
                )
              )}
            </div>
          </div>
        </section>
      )}

      <section className="border-b border-border px-6 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Active Tractor Auctions</h2>
            <Link
              href="/search?category=tractor"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all tractors <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No active auctions right now. New listings appear as each source syncs.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {homepageSlot && (
        <section className="px-6 py-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sponsored
              </span>
              <p className="font-semibold text-foreground">{homepageSlot.listing.title}</p>
              <p className="text-sm text-muted-foreground">
                {homepageSlot.listing.source?.name}
              </p>
            </div>
            <Link
              href={`/listing/${homepageSlot.listing.id}`}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View this auction <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>
      )}

      {endingSoon.length > 0 && (
        <section className="px-6 py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Ending Soon</h2>
              <Link
                href="/search?sort=ending_soon"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all auctions <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {endingSoon.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Only real closed auctions from auction_results; the section stays hidden
          until there is at least one. */}
      {recentResults.length > 0 && (
        <section className="px-6 py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Recent Auction Results</h2>
              <Link
                href="/results"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all results <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/40">
                    <Tractor className="size-6" strokeWidth={1.25} />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">
                      {result.title}
                    </p>
                    {result.finalPrice !== undefined && (
                      <p className="text-sm font-semibold text-primary">
                        Final bid {formatCurrency(result.finalPrice)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {[formatDate(result.soldDate), result.auctionCompany]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#1E4725] px-6 py-10 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.title} className="flex flex-col items-center gap-2 text-center">
              <stat.icon className="size-6 text-white/80" strokeWidth={1.5} />
              <p className="text-sm font-semibold">{stat.title}</p>
              <p className="text-xs text-white/70">{stat.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
