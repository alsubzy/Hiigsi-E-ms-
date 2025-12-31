"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export type UserWithStaff = {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  last_login: string | null
  force_password_change: boolean
  created_at: string
  staff?: {
    employee_id: string
    department: string
    designation: string
    employment_status: string
  }
}

export async function getAllUsers() {
  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from("profiles")
    .select(`
      *,
      staff (
        employee_id,
        department,
        designation,
        employment_status
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return { success: false, error: error.message, users: [] }
  }

  return { success: true, users: users as UserWithStaff[] }
}

export async function getUserById(userId: string) {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from("profiles")
    .select(`
      *,
      staff (*)
    `)
    .eq("id", userId)
    .is("deleted_at", null)
    .single()

  if (error) {
    console.error("Error fetching user:", error)
    return { success: false, error: error.message, user: null }
  }

  return { success: true, user }
}

export async function createUser(data: {
  email: string
  password: string
  full_name: string
  role: string
  phone?: string
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.full_name,
      role: data.role,
    },
  })

  if (authError) {
    console.error("Error creating auth user:", authError)
    return { success: false, error: authError.message }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      role: data.role,
      phone: data.phone || null,
      status: "active",
    })
    .eq("id", authData.user.id)

  if (profileError) {
    console.error("Error updating profile:", profileError)
    return { success: false, error: profileError.message }
  }

  await logAuditAction({
    action: "CREATE",
    module: "users",
    recordId: authData.user.id,
    newData: { email: data.email, role: data.role, full_name: data.full_name },
  })

  revalidatePath("/dashboard/users")
  return { success: true, message: "User created successfully" }
}

export async function updateUser(
  userId: string,
  data: {
    full_name?: string
    role?: string
    phone?: string
    status?: string
  },
) {
  const supabase = await createClient()

  const { data: oldUser } = await supabase.from("profiles").select("*").eq("id", userId).single()

  const { error } = await supabase.from("profiles").update(data).eq("id", userId)

  if (error) {
    console.error("Error updating user:", error)
    return { success: false, error: error.message }
  }

  await logAuditAction({
    action: "UPDATE",
    module: "users",
    recordId: userId,
    oldData: oldUser,
    newData: data,
  })

  revalidatePath("/dashboard/users")
  return { success: true, message: "User updated successfully" }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("profiles").update({ deleted_at: new Date().toISOString() }).eq("id", userId)

  if (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: error.message }
  }

  await logAuditAction({
    action: "DELETE",
    module: "users",
    recordId: userId,
  })

  revalidatePath("/dashboard/users")
  return { success: true, message: "User deleted successfully" }
}

export async function restoreUser(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("profiles").update({ deleted_at: null }).eq("id", userId)

  if (error) {
    console.error("Error restoring user:", error)
    return { success: false, error: error.message }
  }

  await logAuditAction({
    action: "RESTORE",
    module: "users",
    recordId: userId,
  })

  revalidatePath("/dashboard/users")
  return { success: true, message: "User restored successfully" }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) {
    console.error("Error resetting password:", error)
    return { success: false, error: error.message }
  }

  await supabase.from("profiles").update({ force_password_change: true }).eq("id", userId)

  await logAuditAction({
    action: "RESET_PASSWORD",
    module: "users",
    recordId: userId,
  })

  revalidatePath("/dashboard/users")
  return { success: true, message: "Password reset successfully" }
}

export async function toggleUserStatus(userId: string) {
  const supabase = await createClient()

  const { data: user } = await supabase.from("profiles").select("status").eq("id", userId).single()

  const newStatus = user?.status === "active" ? "inactive" : "active"

  const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", userId)

  if (error) {
    console.error("Error toggling user status:", error)
    return { success: false, error: error.message }
  }

  await logAuditAction({
    action: "STATUS_CHANGE",
    module: "users",
    recordId: userId,
    newData: { status: newStatus },
  })

  revalidatePath("/dashboard/users")
  return { success: true, message: `User ${newStatus === "active" ? "activated" : "deactivated"} successfully` }
}

export async function createStaffProfile(data: {
  userId: string
  employeeId: string
  department: string
  designation: string
  qualification?: string
  experienceYears?: number
  dateOfJoining: string
  salary?: number
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("staff").insert({
    user_id: data.userId,
    employee_id: data.employeeId,
    department: data.department,
    designation: data.designation,
    qualification: data.qualification,
    experience_years: data.experienceYears,
    date_of_joining: data.dateOfJoining,
    salary: data.salary,
    address: data.address,
    emergency_contact_name: data.emergencyContactName,
    emergency_contact_phone: data.emergencyContactPhone,
    employment_status: "active",
  })

  if (error) {
    console.error("Error creating staff profile:", error)
    return { success: false, error: error.message }
  }

  await logAuditAction({
    action: "CREATE",
    module: "staff",
    recordId: data.userId,
    newData: data,
  })

  revalidatePath("/dashboard/users")
  return { success: true, message: "Staff profile created successfully" }
}

export async function updateStaffProfile(userId: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase.from("staff").update(data).eq("user_id", userId)

  if (error) {
    console.error("Error updating staff profile:", error)
    return { success: false, error: error.message }
  }

  await logAuditAction({
    action: "UPDATE",
    module: "staff",
    recordId: userId,
    newData: data,
  })

  revalidatePath("/dashboard/users")
  return { success: true, message: "Staff profile updated successfully" }
}

export async function getUserPermissions(userId: string) {
  const supabase = await createClient()

  const { data: user } = await supabase.from("profiles").select("role").eq("id", userId).single()

  if (!user) {
    return { success: false, permissions: [] }
  }

  const { data: role } = await supabase
    .from("roles")
    .select(`
      *,
      role_permissions (
        permissions (*)
      )
    `)
    .eq("name", user.role)
    .single()

  if (!role) {
    return { success: false, permissions: [] }
  }

  const permissions = role.role_permissions.map((rp: any) => rp.permissions)
  return { success: true, permissions }
}

export async function checkPermission(permission: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile) return false

  if (profile.role === "admin") return true

  const { data: hasPermission } = await supabase
    .from("role_permissions")
    .select("id")
    .eq("role_id", (await supabase.from("roles").select("id").eq("name", profile.role).single()).data?.id)
    .eq("permission_id", (await supabase.from("permissions").select("id").eq("name", permission).single()).data?.id)
    .single()

  return !!hasPermission
}

export async function getAuditLogs(filters?: { module?: string; userId?: string; limit?: number }) {
  const supabase = await createClient()

  let query = supabase
    .from("audit_logs")
    .select(`
      *,
      profiles (full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(filters?.limit || 100)

  if (filters?.module) {
    query = query.eq("module", filters.module)
  }

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error("Error fetching audit logs:", error)
    return { success: false, error: error.message, logs: [] }
  }

  return { success: true, logs }
}

async function logAuditAction(data: {
  action: string
  module: string
  recordId?: string
  oldData?: any
  newData?: any
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: data.action,
    module: data.module,
    record_id: data.recordId,
    old_data: data.oldData,
    new_data: data.newData,
  })
}

export async function getRolesAndPermissions() {
  const supabase = await createClient()

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select(`
      *,
      role_permissions (
        permissions (*)
      )
    `)
    .order("name")

  if (rolesError) {
    console.error("Error fetching roles:", rolesError)
    return { success: false, roles: [], permissions: [] }
  }

  const { data: permissions, error: permissionsError } = await supabase
    .from("permissions")
    .select("*")
    .order("module, action")

  if (permissionsError) {
    console.error("Error fetching permissions:", permissionsError)
    return { success: false, roles: [], permissions: [] }
  }

  return { success: true, roles, permissions }
}
