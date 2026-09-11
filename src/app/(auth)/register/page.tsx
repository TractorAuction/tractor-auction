import { MailCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { signUp } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Create an Account — TractorAuction.com",
  robots: { index: false, follow: false },
}

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function RegisterPage(props: PageProps<"/register">) {
  const params = await props.searchParams
  const error = first(params.error)
  const checkEmail = first(params.check_email) === "1"

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-9 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Confirm your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent you a confirmation link. Click it to finish setting up your account, then
          log in.
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
          Back to log in
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Free. Save auctions and get alerted when matching tractors are listed.
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

      <form action={signUp} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Name</span>
          <input name="full_name" autoComplete="name" className={fieldClass} />
        </label>

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
            autoComplete="new-password"
            minLength={8}
            required
            className={fieldClass}
          />
          <span className="text-xs text-muted-foreground">At least 8 characters.</span>
        </label>

        <Button type="submit" size="lg" className="mt-1">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
