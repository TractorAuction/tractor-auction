import { cn } from "@/lib/utils"

export type Column<T> = {
  key: string
  header: string
  /** Right-align numeric columns; the header follows the cells. */
  align?: "left" | "right"
  className?: string
  cell: (row: T) => React.ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty = "Nothing here yet.",
}: {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  empty?: string
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    )
  }

  return (
    // Tables are the one thing allowed to be wider than the page, so it scrolls
    // inside its own container rather than pushing the layout sideways.
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  column.align === "right" ? "text-right" : "text-left"
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-3 py-2.5 align-middle",
                    column.align === "right" && "text-right",
                    column.className
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const toneClasses = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-primary/10 text-primary",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
} as const

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: keyof typeof toneClasses
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  )
}
