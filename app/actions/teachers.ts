"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getTeachers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      teacher_profile:teacher_profiles(*)
    `)
    .eq("role", "teacher")
    .order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching teachers:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function createTeacherProfile(profileData: {
  employee_id: string
  department?: string
  specialization?: string
  qualification?: string
  experience_years: number
  joining_date: string
  phone?: string
  address?: string
  teacher_id: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("teacher_profiles")
    .insert([
      {
        id: profileData.teacher_id,
        employee_id: profileData.employee_id,
        department: profileData.department,
        specialization: profileData.specialization,
        qualification: profileData.qualification,
        experience_years: profileData.experience_years,
        joining_date: profileData.joining_date,
        phone: profileData.phone,
        address: profileData.address,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating teacher profile:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/teachers")
  return { success: true, data }
}

export async function getTeacherAttendance(teacherId?: string, date?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("teacher_attendance")
    .select(`
      *,
      teacher:profiles(full_name)
    `)
    .order("date", { ascending: false })

  if (teacherId) {
    query = query.eq("teacher_id", teacherId)
  }

  if (date) {
    query = query.eq("date", date)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching teacher attendance:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function markTeacherAttendance(attendanceData: {
  teacher_id: string
  date: string
  status: "present" | "absent" | "late" | "half_day" | "on_leave"
  check_in_time?: string
  check_out_time?: string
  remarks?: string
}) {
  const supabase = await createClient()

  // Check if attendance already exists for this teacher and date
  const { data: existing } = await supabase
    .from("teacher_attendance")
    .select("id")
    .eq("teacher_id", attendanceData.teacher_id)
    .eq("date", attendanceData.date)
    .single()

  let result
  if (existing) {
    // Update existing attendance
    result = await supabase
      .from("teacher_attendance")
      .update({
        status: attendanceData.status,
        check_in_time: attendanceData.check_in_time,
        check_out_time: attendanceData.check_out_time,
        remarks: attendanceData.remarks,
      })
      .eq("id", existing.id)
      .select()
      .single()
  } else {
    // Insert new attendance
    result = await supabase.from("teacher_attendance").insert([attendanceData]).select().single()
  }

  if (result.error) {
    console.error("Error marking teacher attendance:", result.error)
    return { success: false, error: result.error.message }
  }

  revalidatePath("/dashboard/teachers")
  return { success: true, data: result.data }
}

export async function getTeacherEvaluations(teacherId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("teacher_evaluations")
    .select(`
      *,
      teacher:profiles!teacher_id(full_name),
      evaluator:profiles!evaluator_id(full_name),
      academic_year:academic_years(year_name)
    `)
    .order("evaluation_date", { ascending: false })

  if (teacherId) {
    query = query.eq("teacher_id", teacherId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching teacher evaluations:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function createTeacherEvaluation(evaluationData: {
  teacher_id: string
  evaluation_date: string
  academic_year_id: string
  teaching_quality: number
  student_engagement: number
  professionalism: number
  overall_rating: number
  comments?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("teacher_evaluations")
    .insert([
      {
        ...evaluationData,
        evaluator_id: user.id,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating teacher evaluation:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/teachers")
  return { success: true, data }
}
