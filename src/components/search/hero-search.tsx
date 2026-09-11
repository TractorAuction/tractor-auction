"use client"

import { SlidersHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { FILTER_PARAMS } from "@/lib/listings/filters"

const selectClass =
  "h-10 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function HeroSearch({
  makes = [],
  states = [],
}: {
  makes?: string[]
  states?: string[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const params = new URLSearchParams()
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value) params.set(key, value)
    }
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-2">
      <div className="flex overflow-hidden rounded-lg bg-white shadow-lg">
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by Make, Model, or Keyword..."
          className="h-12 flex-1 border-0 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="lg" className="m-1.5 rounded-md px-5">
          Search
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select name={FILTER_PARAMS.make} defaultValue="" className={selectClass}>
          <option value="">All Makes</option>
          {makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
        <input
          type="text"
          name={FILTER_PARAMS.model}
          placeholder="Model"
          className={`${selectClass} w-32`}
        />
        <input
          type="number"
          name={FILTER_PARAMS.year_min}
          placeholder="Year Min"
          className={`${selectClass} w-24`}
        />
        <input
          type="number"
          name={FILTER_PARAMS.year_max}
          placeholder="Year Max"
          className={`${selectClass} w-24`}
        />
        <select name={FILTER_PARAMS.location_state} defaultValue="" className={selectClass}>
          <option value="">Location</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {/* The full filter panel lives on the results page. */}
        <Button
          type="submit"
          variant="secondary"
          className="h-10 gap-1.5 bg-foreground text-background hover:bg-foreground/85"
        >
          <SlidersHorizontal className="size-3.5" />
          More Filters
        </Button>
      </div>
    </form>
  )
}
