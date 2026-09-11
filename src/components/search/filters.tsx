"use client"

import { X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useId } from "react"

import { Button } from "@/components/ui/button"
import { FILTER_PARAMS } from "@/lib/listings/filters"
import type { FilterFacets } from "@/lib/listings/queries"
import { cn } from "@/lib/utils"

const fieldClass =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

export function Filters({
  facets,
  className,
}: {
  facets: FilterFacets
  className?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formId = useId()

  // The URL holds the search state, so applying filters is just a navigation.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams()
    const existingQuery = searchParams.get(FILTER_PARAMS.query)
    if (existingQuery) params.set(FILTER_PARAMS.query, existingQuery)

    const existingSort = searchParams.get(FILTER_PARAMS.sort_by)
    if (existingSort) params.set(FILTER_PARAMS.sort_by, existingSort)

    for (const [key, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim())
    }

    // Any filter change invalidates the current page number.
    router.push(`/search?${params.toString()}`)
  }

  function handleReset() {
    const params = new URLSearchParams()
    const existingQuery = searchParams.get(FILTER_PARAMS.query)
    if (existingQuery) params.set(FILTER_PARAMS.query, existingQuery)
    router.push(`/search?${params.toString()}`)
  }

  // Remounting on URL change resets every uncontrolled input to the new state.
  const stateKey = searchParams.toString()

  return (
    <form
      key={stateKey}
      id={formId}
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" /> Clear
        </button>
      </div>

      <Field label="Make">
        <select
          name={FILTER_PARAMS.make}
          defaultValue={searchParams.get(FILTER_PARAMS.make) ?? ""}
          className={fieldClass}
        >
          <option value="">All makes</option>
          {facets.makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Model">
        <input
          type="text"
          name={FILTER_PARAMS.model}
          defaultValue={searchParams.get(FILTER_PARAMS.model) ?? ""}
          placeholder="Any model"
          className={fieldClass}
        />
      </Field>

      <Field label="Year">
        <div className="flex items-center gap-2">
          <input
            type="number"
            name={FILTER_PARAMS.year_min}
            defaultValue={searchParams.get(FILTER_PARAMS.year_min) ?? ""}
            placeholder="Min"
            className={fieldClass}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="number"
            name={FILTER_PARAMS.year_max}
            defaultValue={searchParams.get(FILTER_PARAMS.year_max) ?? ""}
            placeholder="Max"
            className={fieldClass}
          />
        </div>
      </Field>

      <Field label="Horsepower">
        <div className="flex items-center gap-2">
          <input
            type="number"
            name={FILTER_PARAMS.horsepower_min}
            defaultValue={searchParams.get(FILTER_PARAMS.horsepower_min) ?? ""}
            placeholder="Min"
            className={fieldClass}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="number"
            name={FILTER_PARAMS.horsepower_max}
            defaultValue={searchParams.get(FILTER_PARAMS.horsepower_max) ?? ""}
            placeholder="Max"
            className={fieldClass}
          />
        </div>
      </Field>

      <Field label="Max hours">
        <input
          type="number"
          name={FILTER_PARAMS.hours_max}
          defaultValue={searchParams.get(FILTER_PARAMS.hours_max) ?? ""}
          placeholder="Any"
          className={fieldClass}
        />
      </Field>

      <Field label="Current bid">
        <div className="flex items-center gap-2">
          <input
            type="number"
            name={FILTER_PARAMS.price_min}
            defaultValue={searchParams.get(FILTER_PARAMS.price_min) ?? ""}
            placeholder="Min $"
            className={fieldClass}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="number"
            name={FILTER_PARAMS.price_max}
            defaultValue={searchParams.get(FILTER_PARAMS.price_max) ?? ""}
            placeholder="Max $"
            className={fieldClass}
          />
        </div>
      </Field>

      <Field label="State">
        <select
          name={FILTER_PARAMS.location_state}
          defaultValue={searchParams.get(FILTER_PARAMS.location_state) ?? ""}
          className={fieldClass}
        >
          <option value="">All states</option>
          {facets.states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Auction source">
        <select
          name={FILTER_PARAMS.source_id}
          defaultValue={searchParams.get(FILTER_PARAMS.source_id) ?? ""}
          className={fieldClass}
        >
          <option value="">All sources</option>
          {facets.sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ending before">
        <input
          type="date"
          name={FILTER_PARAMS.ending_before}
          defaultValue={searchParams.get(FILTER_PARAMS.ending_before) ?? ""}
          className={fieldClass}
        />
      </Field>

      <Button type="submit" className="w-full">
        Apply filters
      </Button>
    </form>
  )
}
