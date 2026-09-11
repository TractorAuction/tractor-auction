import { ArrowRight, BarChart3, CheckCircle2, Link2, Search, Wallet } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "List Your Auctions — Partner with TractorAuction.com",
  description:
    "Send your tractor and equipment auctions to more qualified buyers. Free traffic, no commission, no exclusivity.",
  alternates: { canonical: "/partner" },
}

const benefits = [
  {
    icon: Search,
    title: "More qualified buyers",
    description:
      "Buyers searching for the exact make, model, and hours you are selling find your lots and click through to bid on your site.",
  },
  {
    icon: Wallet,
    title: "No commission, no fees",
    description:
      "We never take a cut of your sales. Bidding, payment, and settlement stay entirely on your platform.",
  },
  {
    icon: Link2,
    title: "You keep the buyer",
    description:
      "Every listing links straight to your auction page. We do not host bidding and we do not compete for your consignors.",
  },
  {
    icon: BarChart3,
    title: "Traffic reporting",
    description:
      "See how many buyers we sent you, which equipment categories perform, and what your listings are worth to us.",
  },
]

const steps = [
  {
    title: "Apply",
    description: "Tell us who you are, what you sell, and how your listings are published.",
  },
  {
    title: "Connect your listings",
    description:
      "Send an API endpoint, RSS or XML feed, CSV export, or a shared sheet. Whatever you already produce, we will work from it.",
  },
  {
    title: "Go live",
    description:
      "Your auctions appear in search within a day of your first sync, and refresh automatically from then on.",
  },
]

const formats = ["API", "RSS", "XML", "CSV", "FTP drop", "Email export", "Google Sheets"]

export default function PartnerLandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-[#1E4725] px-6 py-16 text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-5">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Put your auctions in front of more buyers.
          </h1>
          <p className="max-w-2xl text-white/80">
            TractorAuction.com is where buyers search every major tractor auction at once. We
            send them to you to bid. There is no cost, no commission, and no exclusivity —
            we are a search engine for your listings, not a competitor.
          </p>
          <Button
            size="lg"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/partner/register" />}
            className="bg-white text-[#1E4725] hover:bg-white/90"
          >
            Apply to list your auctions <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <benefit.icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{benefit.title}</p>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/40 px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <h2 className="text-2xl font-semibold text-foreground">How it works</h2>
          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
            <p className="text-sm font-medium text-foreground">
              We accept listings in whatever format you already have
            </p>
            <div className="flex flex-wrap gap-2">
              {formats.map((format) => (
                <span
                  key={format}
                  className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <CheckCircle2 className="size-3 text-primary" />
                  {format}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              No feed at all? You can add listings by hand from the partner dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Ready to reach more bidders?
          </h2>
          <p className="text-muted-foreground">
            Applications are reviewed within two business days.
          </p>
          <Button size="lg" nativeButton={false} render={<Link href="/partner/register" />}>
            Apply now <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}
