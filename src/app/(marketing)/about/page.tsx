import { Ban, Globe, Search, Tractor } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "About TractorAuction.com — How We Work",
  description:
    "TractorAuction.com is a search engine for tractor and farm equipment auctions. We aggregate listings from every major auction site and send you there to bid.",
  alternates: { canonical: "/about" },
}

const principles = [
  {
    icon: Search,
    title: "We are a search engine, not an auction house",
    description:
      "Every listing you find here lives on someone else's site. We index it, make it searchable alongside everything else, and send you to the original auction to register and bid.",
  },
  {
    icon: Ban,
    title: "We never take a bid or a commission",
    description:
      "Bidding, payment, inspection and transport are all handled by the auction company. We are not a party to your transaction and we take no cut of the sale.",
  },
  {
    icon: Globe,
    title: "Authorized data only",
    description:
      "We work from feeds and APIs that auction companies give us permission to use. We do not scrape sites that have not agreed to be listed.",
  },
  {
    icon: Tractor,
    title: "Built for people buying iron",
    description:
      "Filters that match how buyers actually shop: hours, horsepower, drive type, year, and how far the machine is from you.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-[#1E4725] px-6 py-16 text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <h1 className="text-4xl font-bold leading-tight">
            One search across every tractor auction.
          </h1>
          <p className="text-white/80">
            Farm equipment auctions are spread across dozens of sites. A buyer looking for a
            particular tractor has to check each one, in its own format, with its own
            filters. TractorAuction.com puts them in a single searchable place.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          {principles.map((principle) => (
            <div key={principle.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <principle.icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{principle.title}</p>
                <p className="text-sm text-muted-foreground">{principle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/40 px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <h2 className="text-2xl font-semibold text-foreground">How we make money</h2>
          <p className="text-muted-foreground">
            Listing on TractorAuction.com is free for auction companies, and searching is
            free for buyers. We earn from sponsored placements: an auction company can pay
            to have a listing or their business promoted on the site.
          </p>
          <p className="text-muted-foreground">
            Promoted listings are always labelled &ldquo;Sponsored&rdquo; and shown in their own
            section, separate from organic search results. Paying does not change where a
            listing ranks in the ordinary results, and it does not change the filters we
            match it against.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Run auctions? List them with us.
          </h2>
          <p className="text-muted-foreground">
            Free, no commission, no exclusivity. We send buyers straight to your site.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="lg" nativeButton={false} render={<Link href="/partner" />}>
              Partner with us
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/search" />}
            >
              Browse auctions
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
