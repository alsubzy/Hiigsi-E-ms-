import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAllUsers, getAuditLogs, getRolesAndPermissions } from "@/app/actions/users"
import UsersClient from "@/components/users/users-client"
import { Users2 } from "lucide-react"

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
    <div className="flex-1 space-y-8 p-8 pt-6 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-200/60 dark:hover:shadow-none">
        <div className="space-y-1">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <Users2 size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">User Matrix</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Configure access control and personnel directories.</p>
            </div>
          </div>
        </div>
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
