"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

/**
 * Watchlist writes run on the user's own session, so the per-user RLS policy
 * from 0004 is what enforces ownership — user_id is never taken from the form.
 */
async function currentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function toggleWatchlist(formData: FormData) {
  const listingId = formData.get("listing_id")
  const watched = formData.get("watched") === "true"

  if (typeof listingId !== "string" || !listingId) return

  const { supabase, user } = await currentUser()
  if (!user) return

  if (watched) {
    await supabase
      .from("watchlist_items")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
  } else {
    await supabase
      .from("watchlist_items")
      .upsert(
        { user_id: user.id, listing_id: listingId },
        { onConflict: "user_id,listing_id" }
      )
  }

  revalidatePath("/account/watchlist")
  revalidatePath(`/listing/${listingId}`)
}

export async function removeSavedSearch(formData: FormData) {
  const id = formData.get("id")
  if (typeof id !== "string" || !id) return

  const { supabase, user } = await currentUser()
  if (!user) return

  await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", user.id)

  revalidatePath("/account/saved-searches")
  revalidatePath("/account/alerts")
}

export async function setSearchAlert(formData: FormData) {
  const id = formData.get("id")
  const enabled = formData.get("enabled") === "true"
  if (typeof id !== "string" || !id) return

  const { supabase, user } = await currentUser()
  if (!user) return

  await supabase
    .from("saved_searches")
    .update({ alert_enabled: enabled })
    .eq("id", id)
    .eq("user_id", user.id)

  revalidatePath("/account/saved-searches")
  revalidatePath("/account/alerts")
}

export type SaveSearchState = { ok: boolean; error?: string; id?: string }

function parseFiltersField(value: FormDataEntryValue | null): Record<string, unknown> | null {
  if (typeof value !== "string") return null
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** Creates a saved search, or with an `id` replaces that search's filters
 *  (the "Edit filters → Update saved search" flow). */
export async function saveSearch(
  _previous: SaveSearchState,
  formData: FormData
): Promise<SaveSearchState> {
  const id = formData.get("id")
  const name = String(formData.get("name") ?? "").trim()
  const alert = formData.get("alert_enabled") === "on"
  const filters = parseFiltersField(formData.get("filters"))
  if (!filters) return { ok: false, error: "Could not read the current filters." }

  const { supabase, user } = await currentUser()
  if (!user) return { ok: false, error: "Log in to save searches." }

  if (typeof id === "string" && id) {
    const { error } = await supabase
      .from("saved_searches")
      .update({ filters })
      .eq("id", id)
      .eq("user_id", user.id)
    if (error) return { ok: false, error: "Could not update this saved search." }
    revalidatePath("/account/saved-searches")
    return { ok: true, id }
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: user.id,
      name: name.slice(0, 120) || "Saved search",
      filters,
      alert_enabled: alert,
    })
    .select("id")
    .single()

  if (error) return { ok: false, error: "Could not save this search." }

  revalidatePath("/account/saved-searches")
  revalidatePath("/account/alerts")
  return { ok: true, id: data.id as string }
}

export async function renameSavedSearch(formData: FormData) {
  const id = formData.get("id")
  const name = String(formData.get("name") ?? "").trim().slice(0, 120)
  if (typeof id !== "string" || !id || !name) return

  const { supabase, user } = await currentUser()
  if (!user) return

  await supabase.from("saved_searches").update({ name }).eq("id", id).eq("user_id", user.id)

  revalidatePath("/account/saved-searches")
  revalidatePath("/account/alerts")
}
