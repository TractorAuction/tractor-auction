"use client"

import { Clock } from "lucide-react"
import { useCallback, useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 1000)
  return () => clearInterval(timer)
}

export function AuctionCountdown({ endDate }: { endDate: string }) {
  // A whole-second primitive keeps the snapshot referentially stable, and the
  // null server snapshot means the clock only starts once hydrated.
  const getSnapshot = useCallback(() => {
    const ms = new Date(endDate).getTime() - Date.now()
    if (Number.isNaN(ms)) return null
    return Math.max(0, Math.floor(ms / 1000))
  }, [endDate])

  const secondsLeft = useSyncExternalStore(subscribe, getSnapshot, () => null)

  if (secondsLeft === null) {
    return <div className="h-[62px]" aria-hidden />
  }

  if (secondsLeft === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
        <Clock className="size-4" /> This auction has ended
      </div>
    )
  }

  const urgent = secondsLeft < 86_400
  const parts = [
    { value: Math.floor(secondsLeft / 86_400), label: "days" },
    { value: Math.floor(secondsLeft / 3600) % 24, label: "hrs" },
    { value: Math.floor(secondsLeft / 60) % 60, label: "min" },
    { value: secondsLeft % 60, label: "sec" },
  ]

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          urgent ? "text-destructive" : "text-muted-foreground"
        )}
      >
        <Clock className="size-3.5" /> {urgent ? "Ending soon" : "Time left"}
      </span>
      <div className="grid grid-cols-4 gap-1.5">
        {parts.map((part) => (
          <div
            key={part.label}
            className={cn(
              "flex flex-col items-center rounded-md border py-1.5",
              urgent ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/50"
            )}
          >
            <span
              className={cn(
                "font-mono text-base font-semibold tabular-nums",
                urgent ? "text-destructive" : "text-foreground"
              )}
            >
              {String(part.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {part.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
