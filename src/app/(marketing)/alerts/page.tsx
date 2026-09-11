import { Bell, Clock, Filter, Mail } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Auction Alerts — Get Notified When Tractors Match | TractorAuction.com",
  description:
    "Save a search and get an email when a matching tractor is listed, plus a reminder before any auction on your watchlist ends.",
  alternates: { canonical: "/alerts" },
}

const features = [
  {
    icon: Filter,
    title: "Save the search you care about",
    description:
      "Make, model, year range, maximum hours, horsepower, state. Save it once and we keep watching it for you.",
  },
  {
    icon: Mail,
    title: "New match emails",
    description:
      "When a tractor matching your saved search is listed by any auction company we track, you hear about it.",
  },
  {
    icon: Clock,
    title: "Ending soon reminders",
    description:
      "We remind you 24 hours before an auction on your watchlist closes, so a machine you wanted does not slip past.",
  },
]

export default async function AlertsLandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Signed-in visitors want the real thing, not the pitch for it.
  if (user) redirect("/account/alerts")

  return (
    <div className="flex flex-1 flex-col">
      <section className="bg-[#1E4725] px-6 py-16 text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
          <Bell className="size-8 text-white/80" strokeWidth={1.5} />
          <h1 className="text-4xl font-bold leading-tight">
            Never miss the tractor you were waiting for.
          </h1>
          <p className="max-w-xl text-white/80">
            Auctions close on their own schedule, not yours. Save a search and we will email
            you when something matches, and again before it ends.
          </p>
          <Button
            size="lg"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/register" />}
            className="bg-white text-[#1E4725] hover:bg-white/90"
          >
            Create a free account
          </Button>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-2">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </span>
              <p className="font-semibold text-foreground">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Free, and no spam
          </h2>
          <p className="text-muted-foreground">
            We only email you about searches you saved and auctions you are watching. Every
            alert has an unsubscribe link, and you can turn any of them off from your
            account at any time.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Log in
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
