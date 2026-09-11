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

export async function saveSearch(formData: FormData) {
  const name = formData.get("name")
  const filters = formData.get("filters")

  if (typeof name !== "string" || typeof filters !== "string") return

  const { supabase, user } = await currentUser()
  if (!user) return

  let parsed: unknown
  try {
    parsed = JSON.parse(filters)
  } catch {
    return
  }

  await supabase.from("saved_searches").insert({
    user_id: user.id,
    name: name.trim() || "Saved search",
    filters: parsed,
  })

  revalidatePath("/account/saved-searches")
}
