import Image from "next/image"
import Link from "next/link"

import { Nav } from "./nav"
import { UserMenu } from "./user-menu"

/**
 * The green bar spans the full viewport; only its contents are held to the
 * page's max width, so wide screens get no white strips beside it. Everything
 * inside is styled for white-on-green.
 */
export function Header() {
  return (
    <header className="relative w-full bg-[#1D552B] text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="TractorAuction.com home">
          <Image
            src="/logo-no-bg.png"
            alt="TractorAuction.com"
            width={471}
            height={236}
            priority
            className="h-10 w-auto sm:h-11"
          />
        </Link>

        <Nav />

        <UserMenu />
      </div>
    </header>
  )
}
