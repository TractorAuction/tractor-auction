"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }}
      className="flex w-full gap-2"
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tractors..."
        className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </form>
  )
}
