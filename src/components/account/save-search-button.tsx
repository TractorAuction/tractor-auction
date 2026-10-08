"use client"

import { Bookmark, Check } from "lucide-react"
import Link from "next/link"
import { useActionState, useState } from "react"

import { saveSearch, type SaveSearchState } from "@/app/account/actions"
import { Button } from "@/components/ui/button"
import type { SearchFilters } from "@/types"

const fieldClass =
  "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

/**
 * Saves the search on screen. Signed-out visitors are sent to log in and
 * brought straight back to the same results. With `editing`, the button
 * replaces that saved search's filters instead of creating a new one.
 */
export function SaveSearchButton({
  filters,
  defaultName,
  signedIn,
  returnTo,
  editing,
}: {
  filters: SearchFilters
  defaultName: string
  signedIn: boolean
  returnTo: string
  editing?: { id: string; name: string }
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<SaveSearchState, FormData>(saveSearch, {
    ok: false,
  })

  if (!signedIn) {
    return (
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href={`/login?next=${encodeURIComponent(returnTo)}`} />}
      >
        <Bookmark className="size-3.5" /> Save search
      </Button>
    )
  }

  if (state.ok) {
    return (
      <p role="status" className="flex items-center gap-1.5 text-sm text-foreground">
        <Check className="size-4 text-primary" />
        {editing ? "Saved search updated." : "Search saved."}
        <Link href="/account/saved-searches" className="font-medium text-primary hover:underline">
          View saved searches
        </Link>
      </p>
    )
  }

  const filtersField = <input type="hidden" name="filters" value={JSON.stringify(filters)} />

  if (editing) {
    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={editing.id} />
        {filtersField}
        <span className="text-sm text-muted-foreground">Editing “{editing.name}”</span>
        <Button type="submit" size="sm" disabled={pending}>
          Update saved search
        </Button>
        {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      </form>
    )
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Bookmark className="size-3.5" /> Save search
      </Button>
    )
  }

  return (
    <form
      action={action}
      className="flex w-full flex-col gap-2 rounded-lg border border-border p-3 sm:w-80"
    >
      {filtersField}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Name</span>
        <input name="name" defaultValue={defaultName} maxLength={120} className={fieldClass} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="alert_enabled" defaultChecked className="size-4" />
        Email me when new auctions match
      </label>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        {state.error && <span className="text-xs text-destructive">{state.error}</span>}
      </div>
    </form>
  )
}
