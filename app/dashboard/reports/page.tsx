import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { ReportsClient } from "@/components/reports/reports-client"
import {
  getOverallStats,
  getAttendanceReport,
  getGradingReport,
  getFinancialReport,
  getTeacherReport,
} from "@/app/actions/reports"

export default async function ReportsPage() {
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

  // Fetch all report data
  const [overallStatsResult, attendanceResult, gradingResult, financialResult, teacherResult] = await Promise.all([
    getOverallStats(),
    getAttendanceReport(),
    getGradingReport(),
    getFinancialReport(),
    getTeacherReport(),
  ])

  return (
    <>
      <ReportsClient
        overallStats={overallStatsResult.data}
        attendanceReport={attendanceResult}
        gradingReport={gradingResult}
        financialReport={financialResult}
        teacherReport={teacherResult}
      />
    </>
  )
}
