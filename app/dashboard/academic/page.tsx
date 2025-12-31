import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AcademicClient } from "@/components/academic/academic-client"
import { getClasses, getSubjects, getTimetable, getCalendarEvents } from "@/app/actions/academic"

export default async function AcademicPage() {
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

  // Check authorization - only admin can access academic management
  if (profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all academic data
  const [classesResult, subjectsResult, timetableResult, eventsResult] = await Promise.all([
    getClasses(),
    getSubjects(),
    getTimetable(),
    getCalendarEvents(),
  ])

  return (
    <DashboardLayout user={profile}>
      <AcademicClient
        initialClasses={classesResult.data || []}
        initialSubjects={subjectsResult.data || []}
        initialTimetable={timetableResult.data || []}
        initialEvents={eventsResult.data || []}
      />
    </DashboardLayout>
  )
}
