import type { EmailOtpType } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"]

/**
 * Finishes sign-in from an email link (sign-up confirmation, password reset).
 * Accepts both shapes Supabase can send:
 *
 *   ?token_hash=…&type=…  verified server side, so it works on any device —
 *                         the link can be opened on a phone after signing up
 *                         on a laptop. Used by the email templates in
 *                         docs/SUPABASE_AUTH_SETUP.md.
 *   ?code=…               the PKCE default. Only works in the browser that
 *                         asked for the email, because the code verifier is a
 *                         cookie there.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const code = params.get("code")
  const tokenHash = params.get("token_hash")
  const type = params.get("type") as EmailOtpType | null
  const nextParam = params.get("next") ?? (type === "recovery" ? "/reset-password" : "/account/watchlist")

  // Never redirect off-site on the strength of a query parameter.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/account/watchlist"

  const fail = (message: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url))

  const supabase = await createClient()

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) return fail(`${error.message} Request a new link and try again.`)
    return NextResponse.redirect(new URL(next, request.url))
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return fail(
        "This link must be opened in the same browser you used to request it. Request a new link and try again."
      )
    }
    return NextResponse.redirect(new URL(next, request.url))
  }

  return fail("That link is missing its confirmation code.")
}
