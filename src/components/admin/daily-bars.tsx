import type { DailyCount } from "@/lib/admin/queries"
import { cn } from "@/lib/utils"

/**
 * CSS-only bar chart — no charting library in the project yet, and a dozen
 * bars for an internal admin page doesn't earn one. Each bar's height is
 * relative to the series' own max, not a fixed scale, so a quiet week doesn't
 * render as a flat line.
 */
export function DailyBars({ series, label }: { series: DailyCount[]; label: string }) {
  const max = Math.max(1, ...series.map((point) => point.count))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-24 items-end gap-0.5">
        {series.map((point) => (
          <div
            key={point.date}
            className="group relative flex h-full flex-1 items-end"
            title={`${point.date}: ${point.count} ${label}`}
          >
            <div
              className={cn(
                "w-full rounded-t-sm transition-colors",
                point.count > 0 ? "bg-primary/70 group-hover:bg-primary" : "bg-muted"
              )}
              style={{ height: `${Math.max(3, (point.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  )
}
