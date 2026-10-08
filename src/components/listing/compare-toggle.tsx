"use client"

import { GitCompareArrows } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

import { MAX_COMPARE, useCompare, type CompareItem } from "./compare-context"

/**
 * Sits inside a ListingCard's own <Link>, so a click must stop that link's
 * navigation — the visitor is selecting the card for comparison, not opening it.
 */
export function CompareToggle({ item, className }: { item: CompareItem; className?: string }) {
  const { isSelected, toggle } = useCompare()
  const [blocked, setBlocked] = useState(false)
  const selected = isSelected(item.id)

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={selected ? "Remove from comparison" : "Add to comparison"}
      title={selected ? "Remove from comparison" : "Add to comparison"}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        const wasSelected = selected
        const nowSelected = toggle(item)
        if (!wasSelected && !nowSelected) {
          // Blocked by MAX_COMPARE rather than toggled off — say so briefly
          // instead of the button silently doing nothing.
          setBlocked(true)
          setTimeout(() => setBlocked(false), 2000)
        }
      }}
      className={cn(
        "relative flex size-7 items-center justify-center rounded-md border backdrop-blur-sm transition-colors pointer-coarse:size-11",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/80 bg-background/80 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <GitCompareArrows className="size-3.5" />
      {blocked && (
        <span
          role="status"
          className="absolute top-full right-0 mt-1 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-sm"
        >
          Compare is full ({MAX_COMPARE} max)
        </span>
      )}
    </button>
  )
}
