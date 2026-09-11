"use client"

import { Bell, Check, GitCompareArrows, Share2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function ListingActions({
  title,
  saveSlot,
}: {
  title: string
  /** The real watchlist button, rendered on the server so it knows the session. */
  saveSlot?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User dismissed the share sheet; fall through to copying the link.
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {saveSlot}
      <Button variant="outline" size="lg" onClick={share} className="w-full">
        {copied ? <Check className="size-4 text-primary" /> : <Share2 className="size-4" />}
        {copied ? "Link copied" : "Share"}
      </Button>
      <Button variant="outline" size="lg" className="w-full">
        <Bell className="size-4" />
        Set Alert
      </Button>
      <Button variant="outline" size="lg" className="w-full">
        <GitCompareArrows className="size-4" />
        Compare
      </Button>
    </div>
  )
}
