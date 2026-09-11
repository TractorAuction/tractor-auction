import { setUserRole } from "@/app/admin/actions"
import { Badge, DataTable } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { getAdminUsers } from "@/lib/admin/queries"
import { formatDate } from "@/lib/format"

const roleTones = {
  admin: "success",
  partner: "warning",
  user: "neutral",
} as const

export default async function AdminUsersPage() {
  const users = await getAdminUsers()

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} profiles. Rows appear once sign-up is live.
        </p>
      </div>

      {users.length === 0 && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          No profiles yet. A profile row is created automatically the first time
          someone registers.
        </p>
      )}

      <DataTable
        rows={users}
        getRowKey={(row) => row.id}
        empty="No registered users yet."
        columns={[
          {
            key: "user",
            header: "User",
            cell: (row) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{row.full_name ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{row.email ?? row.id}</span>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            cell: (row) => (
              <Badge tone={roleTones[row.role as keyof typeof roleTones] ?? "neutral"}>
                {row.role}
              </Badge>
            ),
          },
          {
            key: "joined",
            header: "Joined",
            cell: (row) => (
              <span className="whitespace-nowrap text-muted-foreground">
                {formatDate(row.created_at) ?? "—"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (row) => (
              <form action={setUserRole} className="flex items-center justify-end gap-1.5">
                <input type="hidden" name="id" value={row.id} />
                <select
                  name="role"
                  defaultValue={row.role}
                  className="h-7 rounded-lg border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring"
                >
                  <option value="user">user</option>
                  <option value="partner">partner</option>
                  <option value="admin">admin</option>
                </select>
                <Button type="submit" size="xs" variant="outline">
                  Save
                </Button>
              </form>
            ),
          },
        ]}
      />
    </>
  )
}
