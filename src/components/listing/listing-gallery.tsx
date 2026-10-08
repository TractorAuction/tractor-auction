"use client"

import { ChevronLeft, ChevronRight, Expand } from "lucide-react"
import Image from "next/image"

import { ListingImagePlaceholder } from "./listing-image-placeholder"
import { useState } from "react"

import { cn } from "@/lib/utils"

type ListingGalleryProps = {
  images: string[]
  category?: string
  title: string
}

export function ListingGallery({ images, title, category }: ListingGalleryProps) {
  const [active, setActive] = useState(0)

  const step = (delta: number) => {
    setActive((current) => (current + delta + images.length) % images.length)
  }

  // No photo count, no arrows, no thumbnail strip when the source feed carried
  // no images — an empty gallery should not imply photos exist to be clicked.
  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border">
        <ListingImagePlaceholder category={category} iconClassName="size-24" />
        <p className="absolute inset-x-0 bottom-3 text-center text-xs text-muted-foreground">
          Photos are on the auction company&apos;s listing.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={images[active]}
          alt={`${title} — photo ${active + 1} of ${images.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 640px, 100vw"
          className="object-cover"
        />

        {images.length > 1 && (
          <>
            <GalleryArrow direction="prev" onClick={() => step(-1)} />
            <GalleryArrow direction="next" onClick={() => step(1)} />
            <span className="absolute bottom-3 right-3 rounded-md bg-foreground/70 px-2 py-1 text-xs font-medium text-background backdrop-blur-sm">
              {active + 1} / {images.length}
            </span>
          </>
        )}

        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-foreground/70 px-2 py-1 text-xs font-medium text-background opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Expand className="size-3.5" /> View full size
        </span>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted transition-colors",
                index === active
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Image src={image} alt="" fill sizes="128px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GalleryArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next"
  onClick: () => void
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-opacity hover:bg-background",
        "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
        direction === "prev" ? "left-3" : "right-3"
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
