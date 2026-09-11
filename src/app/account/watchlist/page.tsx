import { Heart } from "lucide-react"
import Link from "next/link"

import { ListingGrid } from "@/components/listing/listing-grid"
import { Button } from "@/components/ui/button"
import { mapListing } from "@/lib/listings/queries"
import { createClient } from "@/lib/supabase/server"
import type { Listing } from "@/types"

export default async function WatchlistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The layout guarantees a session; this keeps TypeScript honest.
  if (!user) return null

  const { data } = await supabase
    .from("watchlist_items")
    .select("listing:listings(*, source:auction_sources(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const listings = (data ?? [])
    .map((row) => (row as Record<string, unknown>).listing)
    .filter((listing): listing is Record<string, unknown> => Boolean(listing))
    .map((listing) => mapListing(listing)) as Listing[]

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          {listings.length === 0
            ? "Auctions you save appear here."
            : `${listings.length} saved ${listings.length === 1 ? "auction" : "auctions"}.`}
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Heart className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Nothing saved yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap the heart on any auction to keep an eye on it. We will show you how long is
            left before it ends.
          </p>
          <Button nativeButton={false} render={<Link href="/search" />}>
            Browse auctions
          </Button>
        </div>
      ) : (
        <ListingGrid listings={listings} />
      )}
    </>
  )
}
