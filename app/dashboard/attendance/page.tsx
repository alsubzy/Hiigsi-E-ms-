import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { Header } from "@/components/dashboard/header"
import { AttendanceClient } from "@/components/attendance/attendance-client"

export default async function AttendancePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  // Check if user has permission to view attendance
  if (!["admin", "teacher", "staff"].includes(profile.role)) {
    redirect("/dashboard")
  }

  return (
    <>
      <Header title="Attendance" description="Mark and track student attendance" />
      <AttendanceClient userRole={profile.role} />
    </>
  )
}
