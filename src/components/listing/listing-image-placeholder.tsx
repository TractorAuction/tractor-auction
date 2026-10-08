import { Tractor } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Shown when the source feed carried no photo. A neutral equipment silhouette,
 * never a stock photo of a tractor: borrowing someone else's machine would
 * misrepresent the one being bid on.
 */
export function ListingImagePlaceholder({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  return (
    <div
      role="img"
      aria-label="Photo not provided by the auction source"
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground/30",
        className
      )}
    >
      <Tractor className={cn("size-12", iconClassName)} strokeWidth={1} />
    </div>
  )
}
