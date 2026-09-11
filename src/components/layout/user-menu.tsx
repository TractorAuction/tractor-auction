import { Heart, LayoutDashboard, LogOut } from "lucide-react"
import Link from "next/link"

import { signOut } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

/**
 * Header auth controls. Rendered on the server so the signed-in state is
 * correct on first paint rather than flashing "Log In" and then swapping.
 */
export async function UserMenu() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/login" />}>
          Log In
        </Button>
        <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
          Sign Up
        </Button>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const isAdmin = (profile as { role?: string } | null)?.role === "admin"

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin" />}>
          <LayoutDashboard className="size-4" />
          <span className="hidden sm:inline">Admin</span>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/account/watchlist" />}
      >
        <Heart className="size-4" />
        <span className="hidden sm:inline">Watchlist</span>
      </Button>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </form>
    </div>
  )
}
