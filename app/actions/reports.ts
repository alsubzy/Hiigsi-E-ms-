"use server"

import { createClient } from "@/lib/supabase/server"

export async function getOverallStats() {
  const supabase = await createClient()

  // Get student count
  const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active")

  // Get teacher count
  const { count: teacherCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "teacher")

  // Get class count
  const { count: classCount } = await supabase.from("classes").select("*", { count: "exact", head: true }).eq("status", "active")

  // Get total revenue from accounting_payments
  const { data: payments } = await supabase.from("accounting_payments").select("amount")
  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

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

export async function getAttendanceReport(filters?: {
  classId?: string
  sectionId?: string
  studentId?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()

  let query = supabase.from("attendance").select(`
    *,
    student:students(
      first_name, 
      last_name, 
      roll_number,
      sections(
        name,
        classes(name)
      )
    )
  `)

  if (filters?.startDate) {
    query = query.gte("date", filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte("date", filters.endDate)
  }
  if (filters?.studentId) {
    query = query.eq("student_id", filters.studentId)
  }

  // Filter by class/section via student relationship
  // Note: Supabase doesn't support deep filtering on joins easily in simple select
  // We'll fetch and filter if needed, but for performance we should ideally use a view or RPC if filters are heavy

  const { data, error } = await query.order("date", { ascending: false })

  if (error) {
    console.error("Attendance Report Error:", error.message)
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

export async function getAcademicReport(filters?: {
  classId?: string
  sectionId?: string
  academicYearId?: string
}) {
  const supabase = await createClient()

  let query = supabase.from("students").select(`
    *,
    sections(
      name,
      classes(name)
    )
  `)

  if (filters?.sectionId) {
    query = query.eq("section_id", filters.sectionId)
  }

  // For class-level filtering, we might need a join filter if section_id is null
  // But our schema enforces sections for active students

  const { data, error } = await query.eq("status", "active").order("first_name")

  if (error) {
    console.error("Academic Report Error:", error.message)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function getReportFiltersData() {
  const supabase = await createClient()

  const [classes, sections, academicYears, terms, subjects] = await Promise.all([
    supabase.from("classes").select("id, name").eq("status", "active"),
    supabase.from("sections").select("id, name, class_id").eq("status", "active"),
    supabase.from("academic_years").select("id, name, is_current").order("start_date", { ascending: false }),
    supabase.from("terms").select("id, name, is_current, academic_year_id").order("start_date", { ascending: false }),
    supabase.from("subjects").select("id, name, code"),
  ])

  return {
    classes: classes.data || [],
    sections: sections.data || [],
    academicYears: academicYears.data || [],
    terms: terms.data || [],
    subjects: subjects.data || [],
  }
}

export async function getGradingReport(filters?: {
  classId?: string
  sectionId?: string
  subjectId?: string
  termId?: string
  academicYearId?: string
}) {
  const supabase = await createClient()

  let query = supabase.from("class_marks").select(`
    *,
    student:students(
      first_name, 
      last_name, 
      roll_number,
      sections(
        name,
        classes(name)
      )
    ),
    subject:subjects(name, code)
  `)

  if (filters?.termId) {
    // Check if the column is term_id or term (text)
    // Based on schema audit, it might be 'term' text in some tables, but we refactored
    query = query.eq("term_id", filters.termId)
  }
  if (filters?.academicYearId) {
    query = query.eq("academic_year_id", filters.academicYearId)
  }
  if (filters?.subjectId) {
    query = query.eq("subject_id", filters.subjectId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Grading Report Error:", error.message)
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {
        totalGrades: 0,
        averageMarks: "0",
        resultDistribution: {},
      },
    }
  }

  // Calculate statistics
  const totalGrades = data?.length || 0
  const averageMarks = data?.length
    ? (data.reduce((sum, g) => sum + (Number(g.marks) || 0), 0) / data.length).toFixed(1)
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
      totalGrades,
      averageMarks,
      resultDistribution,
    },
  }
}

export async function getFinancialReport(filters?: {
  startDate?: string
  endDate?: string
  studentId?: string
}) {
  const supabase = await createClient()

  let query = supabase.from("accounting_payments").select(`
    *,
    student:students(
      first_name, 
      last_name, 
      roll_number,
      sections(
        name,
        classes(name)
      )
    )
  `)

  if (filters?.startDate) {
    query = query.gte("payment_date", filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte("payment_date", filters.endDate)
  }
  if (filters?.studentId) {
    query = query.eq("student_id", filters.studentId)
  }

  const { data, error } = await query.order("payment_date", { ascending: false })

  if (error) {
    console.error("Financial Report Error:", error.message)
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {
        totalPayments: 0,
        totalRevenue: 0,
        completedPayments: 0,
        revenueByMethod: {},
      },
    }
  }

  // Calculate statistics
  const totalPayments = data?.length || 0
  const totalRevenue = data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const completedPayments = data?.length // accounting_payments are usually completed if they exist

  const revenueByMethod = data?.reduce(
    (acc, p) => {
      const method = p.payment_method || "Other"
      acc[method] = (acc[method] || 0) + Number(p.amount)
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
