"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

/** Only allow same-origin paths back, so ?next= cannot bounce off-site. */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account/watchlist"
}

export async function signIn(formData: FormData) {
  const email = text(formData.get("email"))
  const password = text(formData.get("password"))
  const next = safeNext(text(formData.get("next")))

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your email and password.")}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/", "layout")
  redirect(next)
}

export async function signUp(formData: FormData) {
  const email = text(formData.get("email"))
  const password = text(formData.get("password"))
  const fullName = text(formData.get("full_name"))

  if (!email || !password) {
    redirect(`/register?error=${encodeURIComponent("Enter your email and password.")}`)
  }

  if (password.length < 8) {
    redirect(`/register?error=${encodeURIComponent("Use at least 8 characters.")}`)
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // full_name is read by the handle_new_user trigger into profiles.
    options: { data: { full_name: fullName } },
  })

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  // With email confirmation on, signUp returns a user but no session.
  if (data.user && !data.session) {
    redirect("/register?check_email=1")
  }

  revalidatePath("/", "layout")
  redirect("/account/watchlist")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath("/", "layout")
  redirect("/")
}
