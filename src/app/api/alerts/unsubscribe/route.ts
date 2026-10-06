import { NextResponse } from "next/server"

import { verifyUnsubscribeToken } from "@/lib/alerts/unsubscribe-token"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * One-click unsubscribe, reached straight from an email client — GET, no
 * login, no confirmation page before the action happens, per CAN-SPAM's
 * one-step requirement. The token alone proves whose alerts to turn off.
 */
export const dynamic = "force-dynamic"

function page(message: string, status: number) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Email alerts — TractorAuction.com</title>` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1.5rem;color:#1a1d1e}` +
      `a{color:#4a6741}</style></head><body>` +
      `<p>${message}</p><p><a href="/">Back to TractorAuction.com</a></p>` +
      `</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  )
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")
  if (!token) return page("Missing unsubscribe token.", 400)

  let userId: string | null
  try {
    userId = verifyUnsubscribeToken(token)
  } catch (error) {
    console.error("[api/alerts/unsubscribe]", error)
    return page("Unsubscribe is temporarily unavailable. Please try again shortly.", 503)
  }

  if (!userId) return page("This unsubscribe link is invalid or has expired.", 400)

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("profiles")
    .update({ email_alerts_enabled: false })
    .eq("id", userId)

  if (error) {
    console.error("[api/alerts/unsubscribe]", error.message)
    return page("Something went wrong turning off your alerts. Please try again.", 500)
  }

  return page("You're unsubscribed. You won't get any more saved-search or watchlist alert emails.", 200)
}
