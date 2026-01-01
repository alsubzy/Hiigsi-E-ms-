import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAllUsers, getAuditLogs, getRolesAndPermissions } from "@/app/actions/users"
import UsersClient from "@/components/users/users-client"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1
  const limit = 10

  const { users, totalCount } = await getAllUsers(page, limit)
  const auditLogs = await getAuditLogs()
  const { roles, permissions } = await getRolesAndPermissions()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      </div>
      <UsersClient
        users={users || []}
        totalCount={totalCount || 0}
        currentPage={page}
        pageSize={limit}
        auditLogs={auditLogs.logs || []}
        roles={roles}
        permissions={permissions}
      />
    </div>
  )
}
