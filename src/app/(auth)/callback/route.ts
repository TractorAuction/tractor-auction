import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * Exchanges the code from a confirmation or magic-link email for a session.
 * Supabase redirects here after the user clicks the link in their inbox.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const nextParam = request.nextUrl.searchParams.get("next") ?? "/account/watchlist"

  // Never redirect off-site on the strength of a query parameter.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : "/account/watchlist"

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Missing%20confirmation%20code", request.url)
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  return NextResponse.redirect(new URL(next, request.url))
}
