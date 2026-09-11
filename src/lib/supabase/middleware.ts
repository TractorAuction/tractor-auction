import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { supabaseAnonKey, supabaseUrl } from "./env"

/** Routes that require a session. Prefix match. */
const PROTECTED = ["/account", "/admin", "/partner/dashboard"]

/** Routes a signed-in user should not see. */
const AUTH_ONLY = ["/login", "/register"]

/**
 * Refreshes the auth cookie on every request and gates protected routes.
 *
 * Server Components cannot write cookies, so without this the session would
 * silently expire and never refresh. The response object returned here is the
 * one that must reach the browser — it carries the refreshed cookies.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // getUser() revalidates the token with Supabase. Do not swap this for
  // getSession(), which trusts whatever the cookie claims.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && PROTECTED.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    // Send them back where they were headed once they sign in.
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (user && AUTH_ONLY.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = "/account/watchlist"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}
