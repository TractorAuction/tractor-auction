"use client"

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react"

export const MAX_COMPARE = 4
const STORAGE_KEY = "tractorauction:compare"

/** The slice of a Listing the compare bar and page need before their own
 *  fetch completes — just enough to render a chip without a round trip. */
export type CompareItem = {
  id: string
  title: string
  image?: string
}

type CompareContextValue = {
  items: CompareItem[]
  isSelected: (id: string) => boolean
  /** Returns the item's selected state after the call: true if it's now in
   *  the set, false if it was removed or the add was blocked by MAX_COMPARE.
   *  A caller that already knows the prior state (isSelected(id) before
   *  calling) can tell "removed" apart from "blocked" and surface the latter
   *  — this hook doesn't reach for a toast of its own. */
  toggle: (item: CompareItem) => boolean
  remove: (id: string) => void
  clear: () => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

// A minimal external store over localStorage. Native `storage` events only
// fire in *other* tabs/windows, never the one that wrote the value, so a
// same-tab listener set is kept alongside it for writes made here to notify
// this tab's own subscribers immediately.
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) listener()
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  window.addEventListener("storage", callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener("storage", callback)
  }
}

/** Returns the raw string so useSyncExternalStore's reference-equality check
 *  is just string equality — stable across calls when nothing changed. */
function getSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? "[]"
}

function getServerSnapshot(): string {
  return "[]"
}

function parseItems(raw: string): CompareItem[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is CompareItem =>
        Boolean(entry) && typeof entry === "object" && typeof (entry as CompareItem).id === "string"
    )
  } catch {
    // A corrupted or manually-edited value degrades to "nothing selected"
    // rather than breaking every page that reads the compare state.
    return []
  }
}

function readItems(): CompareItem[] {
  if (typeof window === "undefined") return []
  return parseItems(getSnapshot())
}

function writeItems(items: CompareItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Private browsing / storage quota — compare still works for this tab,
    // it just won't survive a reload or sync to other tabs.
  }
  emitChange()
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const items = useMemo(() => parseItems(snapshot), [snapshot])

  const isSelected = useCallback((id: string) => items.some((item) => item.id === id), [items])

  const toggle = useCallback((item: CompareItem) => {
    // Reads the live value rather than closing over `items`, so a toggle
    // right after a cross-tab change acts on the current set, not a stale one.
    const current = readItems()
    const exists = current.some((existing) => existing.id === item.id)

    if (exists) {
      writeItems(current.filter((existing) => existing.id !== item.id))
      return false
    }
    if (current.length >= MAX_COMPARE) {
      return false
    }
    writeItems([...current, item])
    return true
  }, [])

  const remove = useCallback((id: string) => {
    writeItems(readItems().filter((item) => item.id !== id))
  }, [])

  const clear = useCallback(() => writeItems([]), [])

  const value = useMemo(
    () => ({ items, isSelected, toggle, remove, clear }),
    [items, isSelected, toggle, remove, clear]
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const context = useContext(CompareContext)
  if (!context) throw new Error("useCompare must be used inside CompareProvider")
  return context
}
