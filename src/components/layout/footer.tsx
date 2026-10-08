import Image from "next/image"
import Link from "next/link"

const columns: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Browse",
    links: [
      { href: "/search", label: "Search auctions" },
      { href: "/results", label: "Recent results" },
      { href: "/brands", label: "Browse by brand" },
      { href: "/compare", label: "Compare tractors" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/resources", label: "Resources" },
      { href: "/partner", label: "List your auctions" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-[#1C2718] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex w-fit items-center gap-2">
              <Image
                src="/logo-no-bg.png"
                alt="TractorAuction.com"
                width={471}
                height={236}
                className="h-12 w-auto"
              />
            </Link>
            <p className="max-w-xs text-sm text-white/70">
              One search for active and recent tractor auctions from multiple auction
              sites. TractorAuction.com is a search and aggregation platform. We are not
              the auctioneer, seller, or bidding platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-10">
            {columns.map((column) => (
              <div key={column.heading} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  {column.heading}
                </h3>
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-white/80 hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p>&copy; {new Date().getFullYear()} TractorAuction.com. All rights reserved.</p>
            <Link href="/privacy" className="hover:text-white hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white hover:underline">
              Terms of Use
            </Link>
          </div>
          <a href="mailto:partnerships@tractorauction.com" className="hover:text-white hover:underline">
            partnerships@tractorauction.com
          </a>
        </div>
      </div>
    </footer>
  )
}
