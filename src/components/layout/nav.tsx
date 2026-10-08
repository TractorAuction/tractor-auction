"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"

const links = [
  { href: "/search", label: "Auctions" },
  { href: "/results", label: "Results" },
  { href: "/brands", label: "Brands" },
  { href: "/resources", label: "Resources" },
  { href: "/alerts", label: "Alerts" },
  { href: "/about", label: "About" },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Inline links from md up; below that, a menu button opens the same links as
 *  a full-width panel under the header bar. */
export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // Closing on navigation: the panel belongs to the page it was opened on.
  const [openedOn, setOpenedOn] = useState(pathname)
  if (openedOn !== pathname) {
    setOpenedOn(pathname)
    setOpen(false)
  }

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium md:flex">
        {links.map((link) => {
          const active = isActive(pathname, link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-white/80 underline-offset-8 transition-colors hover:text-white",
                active && "text-white underline decoration-2"
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="order-last -mr-2 flex size-11 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="absolute inset-x-0 top-full z-40 border-t border-white/10 bg-[#1D552B] px-4 pb-3 shadow-lg md:hidden"
        >
          {links.map((link) => {
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center border-b border-white/10 text-base text-white/85 last:border-0 hover:text-white",
                  active && "font-semibold text-white"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
