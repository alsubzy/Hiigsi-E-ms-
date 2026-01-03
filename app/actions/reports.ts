"use server"

import { createClient } from "@/lib/supabase/server"

export async function getOverallStats() {
  const supabase = await createClient()

  // Get student count
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true })

  // Get teacher count
  const { count: teacherCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher")

  // Get class count
  const { count: classCount } = await supabase.from("classes").select("*", { count: "exact", head: true })

  // Get total revenue
  const { data: payments } = await supabase.from("payments").select("amount")
  const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

  return {
    success: true,
    data: {
      studentCount: studentCount || 0,
      teacherCount: teacherCount || 0,
      classCount: classCount || 0,
      totalRevenue,
    },
  }
}

export async function getAttendanceReport(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  let query = supabase.from("attendance").select(`
    *,
    student:students(name, classes(name), sections(name))
  `)

  if (startDate) {
    query = query.gte("date", startDate)
  }
  if (endDate) {
    query = query.lte("date", endDate)
  }

  const { data, error } = await query.order("date", { ascending: false })

  if (error) {
    console.warn("Warning: Failed to fetch attendance report. If this is a new installation, please ensure you have run the database migration scripts (specifically 001_initial_schema.sql). Error details:", error.message)
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: "0",
      },
    }
  }

  // Calculate statistics
  const totalRecords = data?.length || 0
  const presentCount = data?.filter((a) => a.status === "present").length || 0
  const absentCount = data?.filter((a) => a.status === "absent").length || 0
  const lateCount = data?.filter((a) => a.status === "late").length || 0
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0"

  return {
    success: true,
    data: data || [],
    stats: {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
    },
  }
}

export async function getGradingReport(grade?: string, term?: string) {
  const supabase = await createClient()

  let query = supabase.from("class_marks").select(`
    *,
    student:students(name, roll_number, classes(name), sections(name))
  `)

  if (grade) {
    query = query.eq("student.class_name", grade)
  }
  if (term) {
    query = query.eq("term", term)
  }

  const { data, error } = await query

  if (error) {
    console.warn("Warning: Failed to fetch grading report. Check if 'grades' table exists. Run migration scripts if missing.", error.message)
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {
        totalGrades: 0,
        averageMarks: "0",
        gradeDistribution: {},
      },
    }
  }

  // Calculate statistics
  const totalMarks = data?.length || 0
  const averageMarks = data?.length
    ? (data.reduce((sum, g) => sum + (g.marks || 0), 0) / data.length).toFixed(1)
    : "0"

  const resultDistribution = data?.reduce(
    (acc, g) => {
      const result = g.result || "N/A"
      acc[result] = (acc[result] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return {
    success: true,
    data: data || [],
    stats: {
      totalMarks,
      averageMarks,
      resultDistribution,
    },
  }
}

export async function getFinancialReport(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  let query = supabase.from("payments").select(`
    *,
    student:students(name, roll_number, classes(name), sections(name))
  `)

  if (startDate) {
    query = query.gte("payment_date", startDate)
  }
  if (endDate) {
    query = query.lte("payment_date", endDate)
  }

  const { data, error } = await query.order("payment_date", { ascending: false })

  if (error) {
    console.warn("Warning: Failed to fetch financial report.", error.message)
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {
        totalPayments: 0,
        totalRevenue: 0,
        completedPayments: 0,
        revenueByMethod: {},
        revenueByFeeType: {},
      },
    }
  }

  // Calculate statistics
  const totalPayments = data?.length || 0
  const totalRevenue = data?.reduce((sum, p) => sum + p.amount, 0) || 0
  const completedPayments = data?.filter((p) => p.status === "completed").length || 0

  const revenueByMethod = data?.reduce(
    (acc, p) => {
      acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const revenueByFeeType = data?.reduce(
    (acc, p) => {
      acc[p.fee_type] = (acc[p.fee_type] || 0) + p.amount
      return acc
    },
    {} as Record<string, number>,
  )

  return {
    success: true,
    data: data || [],
    stats: {
      totalPayments,
      totalRevenue,
      completedPayments,
      revenueByMethod,
      revenueByFeeType,
    },
  }
}

export async function getTeacherReport() {
  const supabase = await createClient()

  const { data: teachers, error } = await supabase
    .from("profiles")
    .select(`
      *,
      teacher_profile:teacher_profiles(*)
    `)
    .eq("role", "teacher")

  if (error) {
    console.warn("Warning: Failed to fetch teacher report.", error.message)
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {
        totalTeachers: 0,
        activeTeachers: 0,
        presentToday: 0,
        attendanceRate: "0",
      },
    }
  }

  // Get today's attendance
  const today = new Date().toISOString().split("T")[0]
  const { data: attendance } = await supabase.from("teacher_attendance").select("*").eq("date", today)

  const totalTeachers = teachers?.length || 0
  const activeTeachers = teachers?.filter((t) => t.teacher_profile?.is_active !== false).length || 0
  const presentToday = attendance?.filter((a) => a.status === "present").length || 0
  const attendanceRate = totalTeachers > 0 ? ((presentToday / totalTeachers) * 100).toFixed(1) : "0"

  return {
    success: true,
    data: teachers || [],
    stats: {
      totalTeachers,
      activeTeachers,
      presentToday,
      attendanceRate,
    },
  }
}
