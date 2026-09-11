"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { FILTER_PARAMS, SORT_LABELS } from "@/lib/listings/filters"
import type { SortOption } from "@/types"

export function SortSelect({ value }: { value: SortOption }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(FILTER_PARAMS.sort_by, event.target.value)
    // Re-sorting starts the result set over.
    params.delete("page")
    router.push(`/search?${params.toString()}`)
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort</span>
      <select
        value={value}
        onChange={handleChange}
        className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {Object.entries(SORT_LABELS).map(([option, label]) => (
          <option key={option} value={option}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
