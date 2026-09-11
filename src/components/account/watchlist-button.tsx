import { Heart } from "lucide-react"
import Link from "next/link"

import { toggleWatchlist } from "@/app/account/actions"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

/**
 * Save/unsave a listing. Anonymous visitors get a link to log in that returns
 * them to the listing, rather than a button that silently does nothing.
 */
export async function WatchlistButton({
  listingId,
  className,
}: {
  listingId: string
  className?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Button
        variant="outline"
        size="lg"
        nativeButton={false}
        className={cn("w-full", className)}
        render={<Link href={`/login?next=${encodeURIComponent(`/listing/${listingId}`)}`} />}
      >
        <Heart className="size-4" />
        Save
      </Button>
    )
  }

  const { data } = await supabase
    .from("watchlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle()

  const watched = Boolean(data)

  return (
    <form action={toggleWatchlist} className={cn("w-full", className)}>
      <input type="hidden" name="listing_id" value={listingId} />
      <input type="hidden" name="watched" value={String(watched)} />
      <Button
        type="submit"
        variant="outline"
        size="lg"
        aria-pressed={watched}
        className={cn("w-full", watched && "border-primary/40 text-primary")}
      >
        <Heart className={cn("size-4", watched && "fill-primary")} />
        {watched ? "Saved" : "Save"}
      </Button>
    </form>
  )
}
