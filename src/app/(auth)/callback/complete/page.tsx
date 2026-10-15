import type { Metadata } from "next"

import { CompleteSignIn } from "./complete-sign-in"

export const metadata: Metadata = {
  title: "Signing you in — TractorAuction.com",
  robots: { index: false, follow: false },
}

/**
 * Second half of /callback for email links that carry their result in the URL
 * fragment, which only the browser can read.
 */
export default function CallbackCompletePage() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-xl font-semibold text-foreground">Signing you in…</h1>
      <p className="text-sm text-muted-foreground">This only takes a moment.</p>
      <CompleteSignIn />
    </div>
  )
}
