import type { Metadata } from "next"
import Image from "next/image"

import { EQUIPMENT_CATEGORIES } from "@/lib/seo/slug"
import { STOCK_PHOTOS } from "@/lib/listings/stock-photos"

export const metadata: Metadata = {
  title: "Photo Credits — TractorAuction.com",
  description: "Credits and licenses for the representative stock photos used on TractorAuction.com.",
  alternates: { canonical: "/photo-credits" },
}

export default function PhotoCreditsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Photo credits</h1>
        <p className="text-muted-foreground">
          When an auction source does not share photos of a lot, we show a stock photo of the same
          kind of equipment, labelled &ldquo;Representative photo&rdquo;. It is not the item for sale:
          the auction company&apos;s own listing has the real photos. These stock photos come from
          Wikimedia Commons under the licenses below.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {EQUIPMENT_CATEGORIES.filter((category) => STOCK_PHOTOS[category.value]).map((category) => {
          const photo = STOCK_PHOTOS[category.value]
          return (
            <li key={category.value} className="flex gap-3 rounded-lg border border-border p-3">
              <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image src={photo.src} alt="" fill sizes="112px" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 text-sm">
                <span className="font-medium text-foreground">{category.label}</span>
                <a
                  href={photo.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {photo.title}
                </a>
                <span className="text-muted-foreground">by {photo.author}</span>
                {photo.licenseUrl ? (
                  <a
                    href={photo.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:underline"
                  >
                    {photo.license}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{photo.license}</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        Photos are resized from the originals. Licensed CC BY-SA photos remain under their original
        license.
      </p>
    </div>
  )
}
