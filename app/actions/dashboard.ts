"use server"

import { createClient } from "@/lib/supabase/server"

export async function getAdminDashboardData() {
    const supabase = await createClient()

    // 1. Core Stats & Breakdown (Parallel)
    const [
        { count: totalStudents },
        { count: activeStudents },
        { count: inactiveStudents },
        { count: totalTeachers },
        { count: totalClasses },
        { data: studentsByClass },
        { data: financialByClass }
    ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "inactive"),
        supabase.from("teacher_profiles").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("sections").select("classes(name), students(count)"), // Simplified grouping
        supabase.from("accounting_payments").select("amount, invoice_id") // We'd join for class-wise later
    ])

    // 2. Attendance Stats (Today)
    const today = new Date().toISOString().split("T")[0]
    const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status")
        .eq("date", today)

    const presentCount = attendanceData?.filter((a) => a.status === "present").length || 0
    const totalAttendance = attendanceData?.length || 0
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

    // 3. Financial Stats (Current Month vs Last Month)
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

    const [
        { data: currentPayments },
        { data: lastPayments },
    ] = await Promise.all([
        supabase.from("accounting_payments").select("amount").gte("payment_date", currentMonthStart).eq("status", "completed"),
        supabase.from("accounting_payments").select("amount").gte("payment_date", lastMonthStart).lt("payment_date", currentMonthStart).eq("status", "completed"),
    ])

    const currentRevenue = currentPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const lastRevenue = lastPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const revenueTrend = lastRevenue > 0 ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100) : 0

    // 4. Pending Fees
    const { data: pendingFees } = await supabase
        .from("student_fees")
        .select("amount, paid_amount")
        .neq("status", "paid")

    const totalPending = pendingFees?.reduce((sum, f) => sum + (Number(f.amount) - Number(f.paid_amount)), 0) || 0

    // 5. Build Chart Data (Last 6 Months)
    interface MonthData {
        name: string;
        revenue: number;
        expenses: number;
        monthIndex: number;
        year: number;
    }
    const months: MonthData[] = []
    const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
            name: monthsNames[d.getMonth()],
            revenue: 0,
            expenses: 0,
            monthIndex: d.getMonth(),
            year: d.getFullYear()
        })
    }

    // Populate chart data from actual payments
    const { data: sixMonthPayments } = await supabase
        .from("accounting_payments")
        .select("amount, payment_date")
        .gte("payment_date", new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString())
        .eq("status", "completed")

    sixMonthPayments?.forEach(p => {
        const pDate = new Date(p.payment_date)
        const chartMonth = months.find(m => m.monthIndex === pDate.getMonth() && m.year === pDate.getFullYear())
        if (chartMonth) {
            chartMonth.revenue += Number(p.amount)
            chartMonth.expenses += Number(p.amount) * 0.4 // Mock expense
        }
    })

    return {
        stats: {
            totalStudents: totalStudents || 0,
            activeStudents: activeStudents || 0,
            inactiveStudents: inactiveStudents || 0,
            totalTeachers: totalTeachers || 0,
            totalClasses: totalClasses || 0,
            attendanceRate,
            currentRevenue,
            revenueTrend,
            totalPending,
        },
        chartData: months.map(({ name, revenue, expenses }) => ({ name, revenue, expenses })),
        recentActivity: [
            { id: "1", type: "payment", title: "Fee Collection", description: `Successfully processed $${currentRevenue.toLocaleString()}`, time: "Just now" },
            { id: "2", type: "student", title: "Attendance Marked", description: `${presentCount} students present today`, time: "Today" },
        ],
        studentsByClass: [], // placeholder for more complex grouping
        upcomingExams: [
            { id: "1", subject: "Mathematics", date: "2024-06-15", class: "Grade 10" },
            { id: "2", subject: "Science", date: "2024-06-18", class: "Grade 9" },
        ],
        topPerformers: [
            { id: "1", name: "Ahlaam Abdi", score: 98, class: "Grade 10" },
            { id: "2", name: "Yaser Fateh", score: 95, class: "Grade 10" },
        ]
    }
}
export async function getTeacherDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch teacher profile
    const { data: teacherProfile } = await supabase
        .from("teacher_profiles")
        .select("id")
        .eq("profile_id", user.id)
        .single()

    if (!teacherProfile) return null

    const [
        { count: assignedClasses },
        { data: studentData },
    ] = await Promise.all([
        supabase.from("sections").select("*", { count: "exact", head: true }).eq("teacher_id", teacherProfile.id),
        supabase.from("students").select("id"), // Simplified
    ])

    return {
        stats: {
            assignedClasses: assignedClasses || 0,
            totalStudents: studentData?.length || 0,
            hoursToday: 6,
            attendanceRate: 94,
        },
        todaySchedule: [
            { id: "1", time: "08:00 AM", subject: "Mathematics", class: "Grade 10A" },
            { id: "2", time: "10:00 AM", subject: "Physics", class: "Grade 10B" },
        ]
    }
}

export async function getSystemAlerts() {
    return [
        { id: "1", type: "warning", message: "Fee collection for Term 1 ends in 3 days." },
        { id: "2", type: "info", message: "Monthly parent-teacher meeting scheduled for Friday." },
    ]
}
