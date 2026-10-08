"use client"

import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { useId, useState } from "react"

import { cn } from "@/lib/utils"

/**
 * Filters collapse behind a button on phones, so results are the first thing
 * on screen instead of ~900px of form fields. From lg up the panel is always
 * open in the sidebar and the button is hidden.
 */
export function FilterDisclosure({
  activeCount,
  children,
}: {
  activeCount: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="rounded-lg border border-border lg:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-4 text-sm font-medium lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      <div id={panelId} className={cn("px-4 pb-4 lg:block lg:p-0", open ? "block" : "hidden")}>
        {children}
      </div>
    </div>
  )
}
