"use client"

import { Bell, Heart, Search } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const links = [
  { href: "/account/watchlist", label: "Watchlist", icon: Heart },
  { href: "/account/saved-searches", label: "Saved searches", icon: Search },
  { href: "/account/alerts", label: "Alerts", icon: Bell },
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {links.map((link) => {
        const active = pathname.startsWith(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
