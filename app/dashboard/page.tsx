import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { AdminView, type AdminDashboardData } from "@/components/dashboard/views/admin-view"
import { TeacherView, type TeacherDashboardData } from "@/components/dashboard/views/teacher-view"
import { getTranslations } from "@/lib/i18n-server"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">Profile Error</h1>
        <p className="mt-2 text-muted-foreground">Could not load user profile.</p>
      </div>
    )
  }

  // --- ADMIN VIEW DATA FETCHING ---
  if (profile.role === "admin" || profile.role === "staff" || profile.role === "accountant") {
    // 1. Students Count
    const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })

    // 2. Attendance
    const today = new Date().toISOString().split("T")[0]
    const { data: todayAttendance } = await supabase.from("attendance").select("status").eq("date", today)
    const presentCount = todayAttendance?.filter((a) => a.status === "present").length || 0
    const absentCount = todayAttendance?.filter((a) => a.status === "absent").length || 0
    const lateCount = todayAttendance?.filter((a) => a.status === "late").length || 0
    const totalAttendance = todayAttendance?.length || 1
    const attendanceRate = Math.round((presentCount / totalAttendance) * 100)

    // 3. Grades (Average)
    // Fetch limited recent grades to avoid heavy query
    const { data: recentGrades } = await supabase.from("grades").select("marks").limit(100)
    const avgMarks =
      recentGrades && recentGrades.length > 0
        ? recentGrades.reduce((sum, g) => sum + Number(g.marks), 0) / recentGrades.length
        : 0
    const avgGrade = avgMarks >= 90 ? "A" : avgMarks >= 80 ? "B+" : avgMarks >= 70 ? "B" : avgMarks >= 60 ? "C+" : "C"

    // 4. Financials (Revenue & Expenses)
    // Fetch payments for this year to build chart
    const currentYear = new Date().getFullYear()
    const { data: yearlyPayments } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .gte("payment_date", `${currentYear}-01-01`)
      .eq("status", "completed")

    // Group by month for chart
    const monthlyRevenueMap = new Map<string, number>()
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    yearlyPayments?.forEach(p => {
      const date = new Date(p.payment_date)
      const monthIndex = date.getMonth() // 0-11
      const monthName = months[monthIndex]
      const current = monthlyRevenueMap.get(monthName) || 0
      monthlyRevenueMap.set(monthName, current + Number(p.amount))
    })

    const chartData = months.map(m => ({
      name: m,
      revenue: monthlyRevenueMap.get(m) || 0,
      expenses: (monthlyRevenueMap.get(m) || 0) * 0.45 // Mock expense ratio for now as we didn't query expenses table
    }))

    // Calc Monthly Revenue
    const currentMonthIndex = new Date().getMonth()
    const currentMonthName = months[currentMonthIndex]
    const monthlyRevenue = monthlyRevenueMap.get(currentMonthName) || 0

    // Calc Trend
    const lastMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1
    const lastMonthRevenue = monthlyRevenueMap.get(months[lastMonthIndex]) || 1 // avoid div by zero
    const revenueTrend = Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)


    const adminData: AdminDashboardData = {
      stats: {
        students: studentCount || 0,
        attendanceRate,
        avgGrade,
        revenue: monthlyRevenue,
        revenueTrend: revenueTrend
      },
      chartData: {
        revenue: chartData.slice(0, currentMonthIndex + 2), // Show up to current month + 1 empty or so
        attendance: { present: presentCount, absent: absentCount, late: lateCount }
      },
      recentActivity: [ // Mock activity for now as we lack a unified logs table
        { id: "1", user: { name: "System", initials: "SY" }, action: "Daily backup completed", time: "2 hours ago" },
        { id: "2", user: { name: profile.full_name, initials: "ME" }, action: "Logged in", time: "Just now" },
      ]
    }

    const t = await getTranslations()

    return (
      <>
        <Header title={`${t.welcomeBack}, ${profile.full_name}`} description={t.loginSubtitle} />
        <div className="p-6">
          <AdminView data={adminData} />
        </div>
      </>
    )
  }

  // --- TEACHER VIEW ---
  if (profile.role === "teacher") {
    // Teacher specific data fetching
    // 1. Classes count
    // Assuming 'classes' table and maybe a relation. For now, simple count or mock.
    // We'll use a safer query if we aren't sure of relation:
    const { count: classesCount } = await supabase.from("classes").select("*", { count: "exact", head: true })

    const teacherData: TeacherDashboardData = {
      stats: {
        classes: classesCount || 3, // Fallback if 0
        students: 120, // Mock
        hoursToday: 4,
        attendanceRate: 92
      },
      recentActivity: []
    }

    return (
      <>
        <Header title={`Hello, ${profile.full_name}`} description="Manage your classes and students." />
        <div className="p-6">
          <TeacherView data={teacherData} />
        </div>
      </>
    )
  }

  // --- FALLBACK / STUDENT VIEW ---
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-8 text-center bg-gray-50 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Welcome</h2>
          <p className="text-muted-foreground">{profile.role} dashboard coming soon.</p>
        </div>
      </div>
    </>
  )
}
