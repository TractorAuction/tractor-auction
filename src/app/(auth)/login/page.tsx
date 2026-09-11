import type { Metadata } from "next"
import Link from "next/link"

import { signIn } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Log In — TractorAuction.com",
  robots: { index: false, follow: false },
}

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams
  const error = first(params.error)
  const next = first(params.next) ?? ""

  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Log in</h1>
        <p className="text-sm text-muted-foreground">
          Save auctions, track your watchlist, and get alerts.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form action={signIn} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={fieldClass}
          />
        </label>

        <Button type="submit" size="lg" className="mt-1">
          Log in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </>
  )
}
