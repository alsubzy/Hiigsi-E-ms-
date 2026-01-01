"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// TYPES

export type AcademicYear = {
  id: string
  year_name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export type Term = {
  id: string
  academic_year_id: string
  name: string
  start_date: string
  end_date: string
  status: "pending" | "active" | "completed"
  created_at: string
}

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  event_type: "holiday" | "exam" | "event" | "meeting"
  start_date: string
  end_date: string
  academic_year_id: string
  created_at: string
}

// ACADEMIC YEARS

export async function getAcademicYears() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("academic_years").select("*").order("start_date", { ascending: false })

  if (error) {
    const isMigrationPending =
      error.code === '42P01' ||
      error.message.includes("relation \"academic_years\" does not exist")

    if (isMigrationPending) {
      console.warn("Academic Module: 'academic_years' table not found. Migration may be pending.")
      return { success: true, data: [] }
    }

    console.error("Error fetching academic years:", JSON.stringify(error, null, 2))
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data as AcademicYear[] }
}

export async function createAcademicYear(data: Omit<AcademicYear, "id" | "created_at" | "is_active">) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("academic_years").insert(data)

    if (error) {
      console.error("Error creating academic year:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/calendar")
    return { success: true, message: "Academic year created successfully" }
  } catch (e: any) {
    console.error("Critical error in createAcademicYear:", e)
    return { success: false, error: "An unexpected error occurred." }
  }
}

export async function setActiveAcademicYear(id: string) {
  try {
    const supabase = await createClient()

    // 1. Set all to inactive
    await supabase.from("academic_years").update({ is_active: false }).neq("id", id)

    // 2. Set target to active
    const { error } = await supabase.from("academic_years").update({ is_active: true }).eq("id", id)

    if (error) {
      console.error("Error setting active academic year:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/calendar")
    return { success: true, message: "Active academic year updated" }
  } catch (e: any) {
    console.error("Critical error in setActiveAcademicYear:", e)
    return { success: false, error: "An unexpected error occurred." }
  }
}

// TERMS

export async function getTerms(academicYearId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase.from("terms").select("*").order("start_date", { ascending: true })

    if (academicYearId) {
      query = query.eq("academic_year_id", academicYearId)
    }

    const { data, error } = await query

    if (error) {
      const isMigrationPending =
        error.code === '42P01' ||
        error.message.includes("relation \"terms\" does not exist")

      if (isMigrationPending) {
        console.warn("Academic Module: 'terms' table not found. Migration may be pending.")
        return { success: true, data: [] }
      }

      console.error("Error fetching terms:", JSON.stringify(error, null, 2))
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as Term[] }
  } catch (e: any) {
    console.error("Critical error in getTerms:", e)
    return { success: false, error: "An unexpected error occurred.", data: [] }
  }
}

export async function createTerm(data: Omit<Term, "id" | "created_at">) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("terms").insert(data)

    if (error) {
      console.error("Error creating term:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/calendar")
    return { success: true, message: "Term created successfully" }
  } catch (e: any) {
    console.error("Critical error in createTerm:", e)
    return { success: false, error: "An unexpected error occurred." }
  }
}

export async function deleteTerm(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("terms").delete().eq("id", id)

    if (error) {
      console.error("Error deleting term:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/calendar")
    return { success: true, message: "Term deleted successfully" }
  } catch (e: any) {
    console.error("Critical error in deleteTerm:", e)
    return { success: false, error: "An unexpected error occurred." }
  }
}

// CALENDAR EVENTS

export async function getCalendarEvents(academicYearId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase.from("calendar_events").select("*").order("start_date", { ascending: true })

    if (academicYearId) {
      query = query.eq("academic_year_id", academicYearId)
    }

    const { data, error } = await query

    if (error) {
      const isMigrationPending =
        error.code === '42P01' ||
        error.message.includes("relation \"calendar_events\" does not exist")

      if (isMigrationPending) {
        console.warn("Academic Module: 'calendar_events' table not found. Migration may be pending.")
        return { success: true, data: [] }
      }

      console.error("Error fetching events:", JSON.stringify(error, null, 2))
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as CalendarEvent[] }
  } catch (e: any) {
    console.error("Critical error in getCalendarEvents:", e)
    return { success: false, error: "An unexpected error occurred.", data: [] }
  }
}

export async function createCalendarEvent(data: Omit<CalendarEvent, "id" | "created_at">) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("calendar_events").insert(data)

    if (error) {
      console.error("Error creating event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/calendar")
    return { success: true, message: "Event created successfully" }
  } catch (e: any) {
    console.error("Critical error in createCalendarEvent:", e)
    return { success: false, error: "An unexpected error occurred." }
  }
}

export async function deleteCalendarEvent(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("calendar_events").delete().eq("id", id)

    if (error) {
      console.error("Error deleting event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/calendar")
    return { success: true, message: "Event deleted successfully" }
  } catch (e: any) {
    console.error("Critical error in deleteCalendarEvent:", e)
    return { success: false, error: "An unexpected error occurred." }
  }
}
