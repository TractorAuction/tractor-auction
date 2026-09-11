import { Tractor } from "lucide-react"
import Link from "next/link"

import { UserMenu } from "./user-menu"
import { Nav } from "./nav"

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
      <Link href="/" className="flex items-center gap-2">
        <Tractor className="size-5 text-primary" strokeWidth={2.25} />
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-foreground">
            TractorAuction<span className="text-primary">.com</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            The #1 Source for Tractor Auctions
          </span>
        </span>
      </Link>

      <Nav />

      <UserMenu />
    </header>
  )
}
