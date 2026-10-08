import { Tractor, Truck } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Shown when the source feed carried no photo. A neutral equipment silhouette,
 * never a stock photo of a tractor: borrowing someone else's machine would
 * misrepresent the one being bid on.
 */
export function ListingImagePlaceholder({
  category,
  className,
  iconClassName,
}: {
  /** Picks the silhouette, so a truck listing does not show a tractor. */
  category?: string
  className?: string
  iconClassName?: string
}) {
  const Icon = category === "truck-trailer" ? Truck : Tractor
  return (
    <div
      role="img"
      aria-label="Photo not provided by the auction source"
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground/30",
        className
      )}
    >
      <Icon className={cn("size-12", iconClassName)} strokeWidth={1} />
    </div>
  )
}
