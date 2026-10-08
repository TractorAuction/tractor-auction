import type { Metadata } from "next"
import Link from "next/link"

import { updatePassword } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Choose a New Password — TractorAuction.com",
  robots: { index: false, follow: false },
}

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/** Reached from the reset email via /callback, which has already signed the
 *  visitor in. Without that session there is nothing to update. */
export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const params = await props.searchParams
  const error = first(params.error)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-xl font-semibold text-foreground">Link expired</h1>
        <p className="text-sm text-muted-foreground">
          This reset link is no longer valid. Links work once, in the browser that requested
          them.
        </p>
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Send a new link
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">For {user.email}</p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form action={updatePassword} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">New password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Confirm new password</span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={fieldClass}
          />
        </label>

        <Button type="submit" size="lg" className="mt-1">
          Update password
        </Button>
      </form>
    </>
  )
}
