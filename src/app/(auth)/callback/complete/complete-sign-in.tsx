"use client"

import { useEffect } from "react"

import { linkErrorMessage } from "@/lib/auth/link-error"
import { createClient } from "@/lib/supabase/client"

function loginWithError(message: string) {
  window.location.replace(`/login?error=${encodeURIComponent(message)}`)
}

export function CompleteSignIn() {
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    const nextParam = new URLSearchParams(window.location.search).get("next") ?? ""
    const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/account/watchlist"

    const errorCode = fragment.get("error_code")
    const errorDescription = fragment.get("error_description")
    if (errorCode || errorDescription || fragment.get("error")) {
      loginWithError(linkErrorMessage(errorCode, errorDescription))
      return
    }

    const accessToken = fragment.get("access_token")
    const refreshToken = fragment.get("refresh_token")
    if (!accessToken || !refreshToken) {
      loginWithError(
        "That link is incomplete. If you already confirmed your email, just log in. Otherwise request a new link."
      )
      return
    }

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) loginWithError(linkErrorMessage(null, error.message))
        // A full load, so the server renders the page with the new session cookie.
        else window.location.replace(next)
      })
  }, [])

  return null
}
