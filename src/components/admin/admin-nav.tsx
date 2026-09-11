"use client"

import {
  Building2,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Star,
  Tractor,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings", icon: Tractor },
  { href: "/admin/sources", label: "Sources", icon: Building2 },
  { href: "/admin/outreach", label: "Outreach", icon: Megaphone },
  { href: "/admin/partners", label: "Partners", icon: Handshake },
  { href: "/admin/sponsored", label: "Sponsored", icon: Star },
  { href: "/admin/users", label: "Users", icon: Users },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {links.map((link) => {
        // Only /admin itself matches exactly; the rest match their subtree.
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)

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
