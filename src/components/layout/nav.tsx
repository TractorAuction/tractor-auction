import Link from "next/link"

// Only routes that exist. /results, /brands, /resources and /alerts are added
// back as their pages land (auction results Day 14, alerts Day 9).
const links = [
  { href: "/search", label: "Auctions" },
  { href: "/category/tractor", label: "Tractors" },
  { href: "/category/combine", label: "Combines" },
  { href: "/partner", label: "List With Us" },
]

export function Nav() {
  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-foreground md:flex">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-primary">
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
