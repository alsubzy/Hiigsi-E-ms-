import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TeachersClient } from "@/components/teachers/teachers-client"
import { getTeachers, getTeacherAttendance } from "@/app/actions/teachers"

export default async function TeachersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  // Check authorization - admin and staff can access
  if (!["admin", "staff"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch teachers data
  const [teachersResult, attendanceResult] = await Promise.all([
    getTeachers(),
    getTeacherAttendance(undefined, new Date().toISOString().split("T")[0]),
  ])

  return (
    <DashboardLayout user={profile}>
      <TeachersClient initialTeachers={teachersResult.data || []} initialAttendance={attendanceResult.data || []} />
    </DashboardLayout>
  )
}
