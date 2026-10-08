import { Heart, LayoutDashboard, LogOut } from "lucide-react"
import Link from "next/link"

import { signOut } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

/**
 * Header auth controls. Rendered on the server so the signed-in state is
 * correct on first paint rather than flashing "Log In" and then swapping.
 */
// Header controls sit on the dark green bar.
const onGreen = "text-white hover:bg-white/10 hover:text-white aria-expanded:bg-white/10"

export async function UserMenu() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <Button
          variant="ghost"
          size="lg"
          className="px-3 text-white hover:bg-white/10 hover:text-white"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Log In
        </Button>
        <Button
          size="lg"
          className="bg-white px-4 text-[#1D552B] hover:bg-white/90"
          nativeButton={false}
          render={<Link href="/register" />}
        >
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
    <div className="ml-auto flex items-center gap-1 md:ml-0">
      {isAdmin && (
        <Button
          variant="ghost"
          size="sm"
          className={onGreen}
          nativeButton={false}
          render={<Link href="/admin" />}
        >
          <LayoutDashboard className="size-4" />
          <span className="hidden sm:inline">Admin</span>
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className={onGreen}
        nativeButton={false}
        render={<Link href="/account/watchlist" />}
      >
        <Heart className="size-4" />
        <span className="hidden sm:inline">Watchlist</span>
      </Button>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className={onGreen}>
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </form>
    </div>
  )
}
