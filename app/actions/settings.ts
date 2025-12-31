"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: { full_name: string; email: string }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: data.full_name })
    .eq("id", user.id)

  if (profileError) {
    console.error("Error updating profile:", profileError)
    return { success: false, error: profileError.message }
  }

  // Update email in auth if changed
  if (data.email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email: data.email })
    if (emailError) {
      console.error("Error updating email:", emailError)
      return { success: false, error: emailError.message }
    }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Update password
  const { error } = await supabase.auth.updateUser({ password: data.newPassword })

  if (error) {
    console.error("Error changing password:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getSchoolSettings() {
  const supabase = await createClient()

  // For now, we'll use academic_years as a proxy for school settings
  const { data, error } = await supabase.from("academic_years").select("*").eq("is_active", true).single()

  if (error) {
    console.error("Error fetching school settings:", error)
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data }
}
