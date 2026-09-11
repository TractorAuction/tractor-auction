import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AccountNav } from "@/components/account/account-nav"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Your Account — TractorAuction.com",
  robots: { index: false, follow: false },
}

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware already redirects anonymous visitors; this is the second gate so
  // the pages below can treat `user` as guaranteed.
  if (!user) redirect("/login?next=/account/watchlist")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle()

  const record = profile as Record<string, unknown> | null
  const name = (record?.full_name as string) || (record?.email as string) || user.email

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
      <aside className="flex flex-col gap-4 lg:w-52 lg:shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Signed in as
          </span>
          <span className="truncate text-sm font-medium text-foreground">{name}</span>
        </div>
        <AccountNav />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6">{children}</main>
    </div>
  )
}
