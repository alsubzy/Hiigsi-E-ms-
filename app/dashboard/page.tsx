import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ClipboardCheck, GraduationCap, DollarSign } from "lucide-react"

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
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  // Fetch real statistics
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })

  const today = new Date().toISOString().split("T")[0]
  const { data: todayAttendance } = await supabase.from("attendance").select("status").eq("date", today)

  const presentCount = todayAttendance?.filter((a) => a.status === "present").length || 0
  const totalAttendance = todayAttendance?.length || 1
  const attendanceRate = Math.round((presentCount / totalAttendance) * 100)

  const { data: recentGrades } = await supabase.from("grades").select("marks").limit(100)
  const avgMarks =
    recentGrades && recentGrades.length > 0
      ? recentGrades.reduce((sum, g) => sum + Number(g.marks), 0) / recentGrades.length
      : 0
  const avgGrade = avgMarks >= 90 ? "A" : avgMarks >= 80 ? "B+" : avgMarks >= 70 ? "B" : avgMarks >= 60 ? "C+" : "C"

  const currentMonth = new Date().toISOString().slice(0, 7)
  const { data: monthlyPayments } = await supabase
    .from("payments")
    .select("amount")
    .gte("payment_date", `${currentMonth}-01`)
    .eq("status", "completed")

  const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const stats = [
    {
      title: "Total Students",
      value: studentCount?.toString() || "0",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Attendance Today",
      value: `${attendanceRate}%`,
      icon: ClipboardCheck,
      color: "text-green-500",
    },
    {
      title: "Average Grade",
      value: avgGrade,
      icon: GraduationCap,
      color: "text-purple-500",
    },
    {
      title: "Monthly Revenue",
      value: `$${monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-orange-500",
    },
  ]

  return (
    <DashboardLayout user={profile}>
      <Header title={`Welcome back, ${profile.full_name}`} description="Here's what's happening in your school today" />
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">System Active</p>
                    <p className="text-xs text-muted-foreground">All modules are operational</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Now</span>
                </div>
                <div className="flex items-center gap-3 border-b pb-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Database Connected</p>
                    <p className="text-xs text-muted-foreground">Supabase integration active</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Now</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ready to Use</p>
                    <p className="text-xs text-muted-foreground">Start managing your school</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Now</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <a
                  href="/dashboard/students"
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors"
                >
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Manage Students</p>
                    <p className="text-xs text-muted-foreground">View and add students</p>
                  </div>
                </a>
                <a
                  href="/dashboard/attendance"
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors"
                >
                  <ClipboardCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Mark Attendance</p>
                    <p className="text-xs text-muted-foreground">Record student attendance</p>
                  </div>
                </a>
                <a
                  href="/dashboard/grading"
                  className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-muted transition-colors"
                >
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Enter Grades</p>
                    <p className="text-xs text-muted-foreground">Update student grades</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
