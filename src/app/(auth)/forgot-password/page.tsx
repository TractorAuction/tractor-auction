import type { Metadata } from "next"
import Link from "next/link"

import { requestPasswordReset } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Reset Password — TractorAuction.com",
  robots: { index: false, follow: false },
}

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ForgotPasswordPage(props: PageProps<"/forgot-password">) {
  const params = await props.searchParams
  const error = first(params.error)
  const sent = first(params.sent) === "1"

  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to choose a new password.
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

      {sent ? (
        <p
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
        >
          If an account exists for that email, a reset link is on its way. Open it in this
          browser. It may take a minute, and check your spam folder.
        </p>
      ) : (
        <form action={requestPasswordReset} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input name="email" type="email" autoComplete="email" required className={fieldClass} />
          </label>

          <Button type="submit" size="lg" className="mt-1">
            Send reset link
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  )
}
