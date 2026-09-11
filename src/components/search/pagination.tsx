import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/** Page numbers around the current page, with ellipses standing in for gaps. */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set<number>([1, total, current])
  if (current - 1 > 1) pages.add(current - 1)
  if (current + 1 < total) pages.add(current + 1)

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const output: (number | "gap")[] = []

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) output.push("gap")
    output.push(page)
  })

  return output
}

export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number
  pageSize: number
  total: number
  searchParams: URLSearchParams
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const href = (target: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (target <= 1) params.delete("page")
    else params.set("page", String(target))
    const query = params.toString()
    return query ? `/search?${query}` : "/search"
  }

  const linkClass =
    "flex h-9 min-w-9 items-center justify-center rounded-lg border border-border px-2 text-sm transition-colors hover:bg-muted"

  return (
    <nav aria-label="Search results pages" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "opacity-40")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={href(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              linkClass,
              entry === page && "border-primary bg-primary text-primary-foreground hover:bg-primary"
            )}
          >
            {entry}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={linkClass} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "opacity-40")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}
