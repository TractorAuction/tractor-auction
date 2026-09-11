import { Search } from "lucide-react"
import Link from "next/link"

import { removeSavedSearch, setSearchAlert } from "@/app/account/actions"
import { Button } from "@/components/ui/button"
import { buildSearchParams } from "@/lib/listings/filters"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/format"
import type { SearchFilters } from "@/types"

type SavedSearchRow = {
  id: string
  name: string
  filters: SearchFilters
  alert_enabled: boolean
  created_at: string
}

/** Turns stored filters back into the search URL that produced them. */
function searchHref(filters: SearchFilters) {
  const params = buildSearchParams(filters ?? {})
  const query = params.toString()
  return query ? `/search?${query}` : "/search"
}

function describe(filters: SearchFilters) {
  const parts = [
    filters.query ? `“${filters.query}”` : null,
    filters.make,
    filters.model,
    filters.location_state,
    filters.year_min || filters.year_max
      ? `${filters.year_min ?? "any"}–${filters.year_max ?? "any"}`
      : null,
    filters.hours_max ? `under ${filters.hours_max.toLocaleString()} hrs` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(" · ") : "All auctions"
}

export default async function SavedSearchesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const searches = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>
    return {
      id: record.id as string,
      name: (record.name as string) ?? "Saved search",
      filters: (record.filters ?? {}) as SearchFilters,
      alert_enabled: Boolean(record.alert_enabled),
      created_at: record.created_at as string,
    } satisfies SavedSearchRow
  })

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Saved searches</h1>
        <p className="text-sm text-muted-foreground">
          Keep a search and turn on alerts to hear about new matches.
        </p>
      </div>

      {searches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Search className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No saved searches yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Run a search with the filters you care about, then save it to come back to it.
          </p>
          <Button nativeButton={false} render={<Link href="/search" />}>
            Start searching
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {searches.map((search) => (
            <li
              key={search.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex min-w-48 flex-col gap-0.5">
                <Link
                  href={searchHref(search.filters)}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {search.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {describe(search.filters)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Saved {formatDate(search.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <form action={setSearchAlert}>
                  <input type="hidden" name="id" value={search.id} />
                  <input type="hidden" name="enabled" value={String(!search.alert_enabled)} />
                  <Button
                    type="submit"
                    size="sm"
                    variant={search.alert_enabled ? "default" : "outline"}
                  >
                    {search.alert_enabled ? "Alerts on" : "Alerts off"}
                  </Button>
                </form>
                <form action={removeSavedSearch}>
                  <input type="hidden" name="id" value={search.id} />
                  <Button type="submit" size="sm" variant="destructive">
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Alert emails start going out once the daily alert job is live (Day 9). Turning
        alerts on now records the preference.
      </p>
    </>
  )
}
