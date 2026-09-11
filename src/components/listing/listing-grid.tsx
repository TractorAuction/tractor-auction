import type { Listing } from "@/types"

import { ListingCard } from "./listing-card"

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return <p className="text-sm text-muted-foreground">No listings found.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
