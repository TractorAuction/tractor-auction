import Image from "next/image"

import { STOCK_PHOTO_LABEL, stockPhotoFor } from "@/lib/listings/stock-photos"
import { cn } from "@/lib/utils"

/**
 * Shown when the source feed carried no usable photo: a stock photo of the
 * same kind of equipment, always labelled as representative so it is never
 * mistaken for the machine being sold. Credits are on /photo-credits and under
 * the gallery on the listing page.
 */
export function ListingImagePlaceholder({
  category,
  className,
  sizes = "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw",
  compact = false,
}: {
  /** Picks the photo, so a truck listing does not show a tractor. */
  category?: string
  className?: string
  sizes?: string
  /** Smaller label for thumbnails such as the compare table. */
  compact?: boolean
}) {
  const photo = stockPhotoFor(category)
  return (
    <div className={cn("relative h-full w-full", className)}>
      <Image src={photo.src} alt={`${STOCK_PHOTO_LABEL} of similar equipment`} fill sizes={sizes} className="object-cover" />
      <span
        className={cn(
          "absolute bottom-2 left-2 rounded bg-foreground/70 font-medium text-background backdrop-blur-sm",
          compact ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-[11px]"
        )}
      >
        {STOCK_PHOTO_LABEL}
      </span>
    </div>
  )
}
