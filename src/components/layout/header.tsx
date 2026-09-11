import Link from "next/link"

import Image from "next/image"

import { Nav } from "./nav"
import { UserMenu } from "./user-menu"

export function Header() {
  return (
    <header className="flex items-center justify-between gap-32 border-b border-border px-6 py-3 mx-auto">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="Logo" width={100} height={100} />
      </Link>

      <Nav />

      <UserMenu />
    </header>
  )
}
