import type { LucideIcon } from "lucide-react"

export function StatsCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
