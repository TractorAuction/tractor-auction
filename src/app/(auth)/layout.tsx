import { Tractor } from "lucide-react"
import Link from "next/link"

// The (auth) group adds no path segment of its own, so there is no generated
// LayoutProps route to key off — children is typed directly.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
      <Link href="/" className="flex items-center justify-center gap-2">
        <Tractor className="size-6 text-primary" strokeWidth={2.25} />
        <span className="text-lg font-bold tracking-tight text-foreground">
          TractorAuction<span className="text-primary">.com</span>
        </span>
      </Link>
      {children}
    </main>
  )
}
