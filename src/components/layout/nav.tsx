"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const links = [
  { href: "/search", label: "Auctions" },
  { href: "/results", label: "Results" },
  { href: "/brands", label: "Brands" },
  { href: "/resources", label: "Resources" },
  { href: "/alerts", label: "Alerts" },
  { href: "/about", label: "About" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-foreground md:flex">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors hover:text-primary",
              active && "text-primary"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
