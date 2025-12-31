"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Academic Year Actions
export async function getAcademicYears() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("academic_years").select("*").order("start_date", { ascending: false })

  if (error) {
    console.error("Error fetching academic years:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function getActiveAcademicYear() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("academic_years").select("*").eq("is_active", true).maybeSingle()

  if (error) {
    console.error("Error fetching active academic year:", error)
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data }
}

// Classes Actions
export async function getClasses() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      academic_year:academic_years(year_name),
      class_teacher:profiles!class_teacher_id(full_name)
    `)
    .order("grade_level", { ascending: true })
    .order("section", { ascending: true })

  if (error) {
    console.error("Error fetching classes:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function createClass(classData: {
  name: string
  grade_level: number
  section: string
  capacity: number
  academic_year_id: string
  room_number?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("classes").insert([classData]).select().single()

  if (error) {
    console.error("Error creating class:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true, data }
}

export async function updateClass(
  id: string,
  classData: Partial<{
    name: string
    grade_level: number
    section: string
    capacity: number
    room_number: string
  }>,
) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("classes").update(classData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating class:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true, data }
}

export async function deleteClass(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("classes").delete().eq("id", id)

  if (error) {
    console.error("Error deleting class:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true }
}

// Subjects Actions
export async function getSubjects() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("subjects").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching subjects:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function createSubject(subjectData: {
  name: string
  code: string
  description?: string
  credits: number
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("subjects").insert([subjectData]).select().single()

  if (error) {
    console.error("Error creating subject:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true, data }
}

export async function updateSubject(
  id: string,
  subjectData: Partial<{
    name: string
    code: string
    description: string
    credits: number
    is_active: boolean
  }>,
) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("subjects").update(subjectData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating subject:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true, data }
}

export async function deleteSubject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("subjects").delete().eq("id", id)

  if (error) {
    console.error("Error deleting subject:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true }
}

// Timetable Actions
export async function getTimetable(classId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("timetable")
    .select(`
      *,
      class:classes(name, grade_level, section),
      subject:subjects(name, code),
      teacher:profiles(full_name)
    `)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })

  if (classId) {
    query = query.eq("class_id", classId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching timetable:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function createTimetableEntry(entryData: {
  class_id: string
  subject_id: string
  teacher_id?: string
  day_of_week: number
  start_time: string
  end_time: string
  room_number?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("timetable").insert([entryData]).select().single()

  if (error) {
    console.error("Error creating timetable entry:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true, data }
}

export async function deleteTimetableEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("timetable").delete().eq("id", id)

  if (error) {
    console.error("Error deleting timetable entry:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true }
}

// Calendar Events Actions
export async function getCalendarEvents() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("calendar_events").select("*").order("start_date", { ascending: true })

  if (error) {
    console.error("Error fetching calendar events:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function createCalendarEvent(eventData: {
  title: string
  description?: string
  event_type: string
  start_date: string
  end_date: string
  academic_year_id: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("calendar_events").insert([eventData]).select().single()

  if (error) {
    console.error("Error creating calendar event:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true, data }
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("calendar_events").delete().eq("id", id)

  if (error) {
    console.error("Error deleting calendar event:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/academic")
  return { success: true }
}
