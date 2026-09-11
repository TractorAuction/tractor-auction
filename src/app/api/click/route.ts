import { NextRequest, NextResponse } from "next/server"

import { getListing } from "@/lib/listings/queries"
import { createClient } from "@/lib/supabase/server"

/**
 * Records an outbound click, then redirects to the auction source.
 *
 * The destination is read from the listing row rather than a query parameter,
 * so this route cannot be used as an open redirect: /api/click?listingId=<id>
 * can only ever send a visitor to that listing's own original_url.
 */
export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get("listingId")

  if (!listingId) {
    return NextResponse.json({ data: null, error: "Missing listingId" }, { status: 400 })
  }

  const listing = await getListing(listingId)

  if (!listing) {
    return NextResponse.json({ data: null, error: "Listing not found" }, { status: 404 })
  }

  let destination: URL
  try {
    destination = new URL(listing.original_url)
  } catch {
    console.error("[api/click] listing has an unusable original_url", listingId)
    return NextResponse.json({ data: null, error: "Listing has no valid URL" }, { status: 502 })
  }

  if (destination.protocol !== "https:" && destination.protocol !== "http:") {
    return NextResponse.json({ data: null, error: "Listing has no valid URL" }, { status: 502 })
  }

  // Tracking must never cost the visitor their click, so a failed insert is
  // logged and the redirect still happens.
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("click_events").insert({
      listing_id: listing.id,
      source_id: listing.source_id,
      user_id: user?.id ?? null,
    })

    if (error) console.error("[api/click] failed to record click", error.message)

    // A click on a promoted listing also counts against its placement, which is
    // what the sponsored performance report bills on.
    if (listing.is_sponsored || listing.is_featured) {
      const { error: placementError } = await supabase.rpc("increment_placement_clicks", {
        target_listing_id: listing.id,
      })
      if (placementError) {
        console.error("[api/click] failed to count placement click", placementError.message)
      }
    }
  } catch (error) {
    console.error("[api/click] failed to record click", error)
  }

  return NextResponse.redirect(destination, { status: 307 })
}
