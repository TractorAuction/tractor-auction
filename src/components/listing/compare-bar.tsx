"use client"

import { GitCompareArrows, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { useCompare } from "./compare-context"

/**
 * Fixed to the bottom of the viewport, site-wide (mounted once in the root
 * layout), so comparison selections made on search results survive a
 * navigation to a listing detail page or another search.
 */
export function CompareBar() {
  const { items, remove, clear } = useCompare()

  if (items.length === 0) return null

  const href = `/compare?ids=${items.map((item) => item.id).join(",")}`

  return (
    <div
      data-compare-bar
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-6">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 py-1 pr-1 pl-2 text-xs font-medium text-foreground"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 rounded-full object-cover"
                />
              ) : (
                <GitCompareArrows className="size-3.5 text-muted-foreground" />
              )}
              <span className="max-w-[10rem] truncate">{item.title}</span>
              <button
                type="button"
                aria-label={`Remove ${item.title} from comparison`}
                onClick={() => remove(item.id)}
                className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
          <Link
            href={href}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Compare ({items.length})
          </Link>
        </div>
      </div>
    </div>
  )
}
