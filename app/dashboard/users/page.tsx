import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAllUsers, getAuditLogs, getRolesAndPermissions } from "@/app/actions/users"
import UsersClient from "@/components/users/users-client"

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  const { users } = await getAllUsers()
  const { logs } = await getAuditLogs({ limit: 50 })
  const { roles, permissions } = await getRolesAndPermissions()

  return <UsersClient users={users || []} auditLogs={logs || []} roles={roles || []} permissions={permissions || []} />
}
