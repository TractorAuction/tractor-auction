import { ArrowRight, Calculator, ClipboardCheck, Gauge, Truck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Buyer Resources — Tractor Auction Guides | TractorAuction.com",
  description:
    "Practical guides for buying tractors at auction: reading hour meters, inspection checklists, what buyer premiums cost, and how to budget for transport.",
  alternates: { canonical: "/resources" },
}

const guides = [
  {
    icon: ClipboardCheck,
    title: "What to check before you bid",
    points: [
      "Ask for the service history. One-owner, shedded machines with records hold value.",
      "Look for hydraulic weeping around remotes and the loader, and oil around the rear axle housing.",
      "Check tyre percentages front and rear. A set of rear duals can run into five figures.",
      "On track machines, ask the width and the remaining percentage on the tracks.",
      "Confirm whether guidance hardware, displays and receivers are actually included.",
    ],
  },
  {
    icon: Gauge,
    title: "Reading hours and condition",
    points: [
      "Engine hours and separator or PTO hours tell different stories. Ask for both when they apply.",
      "Roughly 300 to 500 hours a year is typical for a row crop tractor. Far below that can mean it sat.",
      "A low-hour machine that has not run in years may need more work than a well-used one.",
      "Compare hours against the recent sale prices on our results page before setting your ceiling.",
    ],
  },
  {
    icon: Calculator,
    title: "What you actually pay",
    points: [
      "Buyer premium is usually a percentage on top of the hammer price. Confirm the rate before bidding.",
      "Sales tax may apply depending on the state and your exemption status.",
      "Online bidding sometimes carries its own fee, separate from the buyer premium.",
      "Payment deadlines are short at most auctions. Have financing arranged in advance.",
    ],
  },
  {
    icon: Truck,
    title: "Transport and logistics",
    points: [
      "Budget transport before you bid. Distance is often the difference between a good buy and a bad one.",
      "Most auctions give a removal deadline. Storage fees start after it.",
      "Oversize loads need permits, and dual wheels or wide tracks may have to come off.",
      "Filter by state on our search page to find machines closer to home.",
    ],
  },
]

export default function ResourcesPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Buyer resources</h1>
        <p className="text-muted-foreground">
          Practical notes for buying tractors at auction. Nothing here replaces inspecting a
          machine or reading the auction company&apos;s own terms, which always govern the sale.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {guides.map((guide) => (
          <section
            key={guide.title}
            className="flex flex-col gap-3 rounded-lg border border-border p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <guide.icon className="size-5" />
              </span>
              <h2 className="text-lg font-semibold text-foreground">{guide.title}</h2>
            </div>
            <ul className="flex flex-col gap-2 pl-1">
              {guide.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/50" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-5">
        <h2 className="font-semibold text-foreground">Tools on this site</h2>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/results" className="flex items-center gap-1.5 text-primary hover:underline">
            Recent auction results <ArrowRight className="size-3.5" />
          </Link>
          <Link href="/search" className="flex items-center gap-1.5 text-primary hover:underline">
            Search by hours, horsepower and location <ArrowRight className="size-3.5" />
          </Link>
          <Link href="/alerts" className="flex items-center gap-1.5 text-primary hover:underline">
            Get alerted when a match is listed <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
