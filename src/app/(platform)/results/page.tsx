import { ClipboardList, Tractor } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { formatCurrency, formatDate, formatLocation, formatNumber } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/seo/slug"

export const metadata: Metadata = {
  title: "Recent Tractor Auction Results — Sale Prices | TractorAuction.com",
  description:
    "See what tractors actually sold for at auction. Recent sale prices by make, model, year and hours, aggregated from every major auction site.",
  alternates: { canonical: "/results" },
}

type Row = Record<string, unknown>

type Result = {
  id: string
  title: string
  make?: string
  model?: string
  year?: number
  hours?: number
  soldPrice?: number
  soldDate?: string
  auctionCompany?: string
  locationState?: string
  originalUrl?: string
}

function num(value: unknown) {
  if (value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function str(value: unknown) {
  return typeof value === "string" && value ? value : undefined
}

/**
 * auction_results is populated from expired and sold listings by the Day 14
 * job. Until that runs, sold listings are read directly so the page shows real
 * data the moment anything sells rather than sitting empty.
 */
async function getResults(): Promise<Result[]> {
  const supabase = await createClient()

  const { data: archived } = await supabase
    .from("auction_results")
    .select("*")
    .order("sold_date", { ascending: false, nullsFirst: false })
    .limit(60)

  if (archived && archived.length > 0) {
    return archived.map((row) => {
      const record = row as Row
      return {
        id: record.id as string,
        title: [record.year, record.make, record.model].filter(Boolean).join(" ") || "Equipment",
        make: str(record.make),
        model: str(record.model),
        year: num(record.year),
        hours: num(record.hours),
        soldPrice: num(record.sold_price),
        soldDate: str(record.sold_date),
        auctionCompany: str(record.auction_company),
        locationState: str(record.location_state),
        originalUrl: str(record.original_url),
      }
    })
  }

  const { data: sold } = await supabase
    .from("listings")
    .select("*, source:auction_sources(name)")
    .eq("status", "sold")
    .order("sold_date", { ascending: false, nullsFirst: false })
    .limit(60)

  return (sold ?? []).map((row) => {
    const record = row as Row
    const source = record.source as Row | null
    return {
      id: record.id as string,
      title:
        str(record.title) ??
        [record.year, record.make, record.model].filter(Boolean).join(" ") ??
        "Equipment",
      make: str(record.make),
      model: str(record.model),
      year: num(record.year),
      hours: num(record.hours),
      soldPrice: num(record.sold_price) ?? num(record.current_bid),
      soldDate: str(record.sold_date),
      auctionCompany: str(record.auction_company) ?? str(source?.name),
      locationState: str(record.location_state),
      originalUrl: str(record.original_url),
    }
  })
}

export default async function ResultsPage() {
  const results = await getResults()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Recent auction results</h1>
        <p className="max-w-2xl text-muted-foreground">
          What tractors actually sold for, not what sellers asked. Use recent results to
          judge whether a current bid is fair before you put your own number in.
        </p>
      </header>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <ClipboardList className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No results recorded yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Sale prices appear here as auctions we track close. Nothing in the current
            catalogue has ended yet.
          </p>
          <Link href="/search" className="text-sm font-medium text-primary hover:underline">
            Browse live auctions
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Equipment
                </th>
                <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Hours
                </th>
                <th scope="col" className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sold for
                </th>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sold
                </th>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Auction
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/40">
                        <Tractor className="size-4" strokeWidth={1.25} />
                      </span>
                      <div className="flex flex-col">
                        {result.make ? (
                          <Link
                            href={`/brand/${slugify(result.make)}`}
                            className="font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {result.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground">{result.title}</span>
                        )}
                        {result.locationState && (
                          <span className="text-xs text-muted-foreground">
                            {formatLocation(undefined, result.locationState)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatNumber(result.hours) ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-primary">
                    {formatCurrency(result.soldPrice) ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                    {formatDate(result.soldDate) ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {result.auctionCompany ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Sale prices are reported by the originating auction company. Buyer premiums, taxes
        and transport are not included.
      </p>
    </div>
  )
}
