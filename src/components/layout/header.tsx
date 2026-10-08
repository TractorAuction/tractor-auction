import Link from "next/link"

import Image from "next/image"

import { Nav } from "./nav"
import { UserMenu } from "./user-menu"

export function Header() {
  return (
    <header className="flex items-center justify-between gap-8 border-b border-border px-12 py-3 mx-auto w-full max-w-6xl bg-[#1D552B]">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo-no-bg.png" alt="Logo" width={100} height={100} />
      </Link>

      <Nav />

      <UserMenu />
    </header>
  )
}
