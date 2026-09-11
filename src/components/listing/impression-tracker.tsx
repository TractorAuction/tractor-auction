"use client"

import { useEffect, useRef } from "react"

/**
 * Counts one impression per placement per page view.
 *
 * Renders nothing. The ref guard stops React's development double-effect (and
 * any re-render) from double-counting a placement the advertiser is billed for.
 */
export function ImpressionTracker({ placementIds }: { placementIds: string[] }) {
  const counted = useRef(false)
  const key = placementIds.join(",")

  useEffect(() => {
    if (counted.current || placementIds.length === 0) return
    counted.current = true

    void fetch("/api/impressions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placementIds }),
      keepalive: true,
    }).catch(() => {
      // Analytics must never surface an error to the visitor.
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return null
}
