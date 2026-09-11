import { Bell } from "lucide-react"
import Link from "next/link"

import { setSearchAlert } from "@/app/account/actions"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/format"

export default async function AlertsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: searches }, { count: watchedCount }] = await Promise.all([
    supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .eq("alert_enabled", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("watchlist_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ])

  const active = (searches ?? []).map((row) => {
    const record = row as Record<string, unknown>
    return {
      id: record.id as string,
      name: (record.name as string) ?? "Saved search",
      lastAlertedAt: record.last_alerted_at as string | null,
    }
  })

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Choose what you want to hear about. We email {user.email}.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">New listing alerts</h2>

        {active.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
            <Bell className="size-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No alerts turned on</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Turn alerts on for a saved search and we will email you when new tractors
              match it.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/account/saved-searches" />}
            >
              Manage saved searches
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {active.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{alert.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {alert.lastAlertedAt
                      ? `Last sent ${formatDate(alert.lastAlertedAt)}`
                      : "Not sent yet"}
                  </span>
                </div>
                <form action={setSearchAlert}>
                  <input type="hidden" name="id" value={alert.id} />
                  <input type="hidden" name="enabled" value="false" />
                  <Button type="submit" size="sm" variant="outline">
                    Turn off
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-foreground">Ending soon reminders</h2>
        <p className="text-sm text-muted-foreground">
          You have {watchedCount ?? 0} {watchedCount === 1 ? "auction" : "auctions"} on your
          watchlist. We will remind you 24 hours before each one ends.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Alert delivery goes live with the daily email job (Day 9). Preferences saved here
        are what that job will read.
      </p>
    </>
  )
}
