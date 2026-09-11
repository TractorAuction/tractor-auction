import { createClient } from "@/lib/supabase/server"

/**
 * Admin gate for /admin pages and their server actions.
 *
 * The role lives on profiles.role and is read with the caller's own session, so
 * the owner-read RLS policy applies. There is no preview or bypass flag: the
 * only way in is a signed-in account whose profile row says "admin".
 *
 * Grant one with `npm run create-admin`, or in SQL:
 *   update profiles set role = 'admin' where email = 'you@example.com';
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You need to be logged in as an admin to view this area.")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if ((profile as { role?: string } | null)?.role !== "admin") {
    throw new Error("This account does not have admin access.")
  }

  return { userId: user.id }
}

/** True when the signed-in user is an admin. Never throws. */
export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin()
    return true
  } catch {
    return false
  }
}
