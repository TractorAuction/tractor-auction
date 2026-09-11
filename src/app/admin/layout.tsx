import { ShieldAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AdminNav } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth/require-admin"

export const metadata: Metadata = {
  title: "Admin — TractorAuction.com",
  // The admin area must never reach an index, whatever links to it.
  robots: { index: false, follow: false },
}

// Admin reads live, staff-only data through the service role. Prerendering it
// would both run at build time and cache staff data — always render per request.
export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  try {
    await requireAdmin()
  } catch (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <ShieldAlert className="size-8 text-destructive" />
        <h1 className="text-lg font-semibold text-foreground">Admin access required</h1>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "You do not have access to this area."}
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/login?next=/admin" />}>
          Log in
        </Button>
      </main>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
      <aside className="lg:w-52 lg:shrink-0">
        <AdminNav />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6">{children}</main>
    </div>
  )
}
