"use client"

import { ChevronLeft, ChevronRight, Expand, ImageOff, Tractor } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { cn } from "@/lib/utils"

type ListingGalleryProps = {
  images: string[]
  title: string
  /** Number of placeholder frames to show when the listing has no images yet. */
  placeholderCount?: number
}

export function ListingGallery({ images, title, placeholderCount = 5 }: ListingGalleryProps) {
  const hasImages = images.length > 0
  const frames = hasImages ? images : Array.from({ length: placeholderCount }, () => null)
  const [active, setActive] = useState(0)

  const step = (delta: number) => {
    setActive((current) => (current + delta + frames.length) % frames.length)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
        {hasImages ? (
          <Image
            src={images[active]}
            alt={`${title} — photo ${active + 1} of ${frames.length}`}
            fill
            priority
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
        ) : (
          <PlaceholderFrame index={active} total={frames.length} />
        )}

        {frames.length > 1 && (
          <>
            <GalleryArrow direction="prev" onClick={() => step(-1)} />
            <GalleryArrow direction="next" onClick={() => step(1)} />
          </>
        )}

        <span className="absolute bottom-3 right-3 rounded-md bg-foreground/70 px-2 py-1 text-xs font-medium text-background backdrop-blur-sm">
          {active + 1} / {frames.length}
        </span>

        {hasImages && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-foreground/70 px-2 py-1 text-xs font-medium text-background opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <Expand className="size-3.5" /> View full size
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {frames.map((frame, index) => (
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
            {frame ? (
              <Image
                src={frame}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <Tractor className="size-5" strokeWidth={1.25} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function PlaceholderFrame({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_12px,var(--background)_12px,var(--background)_24px)] text-muted-foreground/60">
      <ImageOff className="size-10" strokeWidth={1.25} />
      <p className="text-sm font-medium">Photo {index + 1} of {total}</p>
      <p className="text-xs text-muted-foreground/70">Image coming from the auction source</p>
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
