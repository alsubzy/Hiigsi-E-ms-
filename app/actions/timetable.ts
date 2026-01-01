"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// TYPES

export type TimetableEntry = {
    id: string
    section_id: string
    subject_id: string
    teacher_id: string
    day_of_week: number // 1=Monday, 7=Sunday
    start_time: string // HH:mm:ss
    end_time: string // HH:mm:ss
    room_number?: string
    created_at: string
    subject?: { name: string; code: string }
    teacher?: { full_name: string }
    section?: { name: string; class: { name: string } }
}

export async function getTimetable(filters?: { sectionId?: string; teacherId?: string }) {
    const supabase = await createClient()

    let query = supabase
        .from("timetable")
        .select(`
      *,
      subject:subjects(name, code),
      teacher:profiles(full_name),
      section:sections(name, class:classes(name))
    `)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true })

    if (filters?.sectionId) {
        query = query.eq("section_id", filters.sectionId)
    }
    if (filters?.teacherId) {
        query = query.eq("teacher_id", filters.teacherId)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching timetable:", error)
        if (error.code === 'PGRST204' || error.message.includes("relation \"timetable\" does not exist")) {
            return { success: true, data: [] }
        }
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as TimetableEntry[] }
}

export async function createTimetableEntry(data: {
    section_id: string
    subject_id: string
    teacher_id: string
    day_of_week: number
    start_time: string
    end_time: string
    room_number?: string
}) {
    try {
        const supabase = await createClient()

        // 1. RBAC (Admin Only)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "Unauthorized" }
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (profile?.role !== "admin") return { success: false, error: "Permission denied. Only admins can schedule classes." }

        // 2. Validate Time
        if (!data.start_time || !data.end_time) return { success: false, error: "Start and end times are required." }
        if (data.start_time >= data.end_time) {
            return { success: false, error: "End time must be after start time." }
        }

        // 3. Conflict Check: Teacher Availability
        const hasTeacherConflict = await checkOverlap(supabase, "teacher_id", data.teacher_id, data.day_of_week, data.start_time, data.end_time)
        if (hasTeacherConflict) return { success: false, error: "Teacher is already booked for this time." }

        // 4. Conflict Check: Section Availability (Student Group)
        const hasSectionConflict = await checkOverlap(supabase, "section_id", data.section_id, data.day_of_week, data.start_time, data.end_time)
        if (hasSectionConflict) return { success: false, error: "This section already has a class at this time." }

        // 5. Conflict Check: Room Availability (if room assigned)
        if (data.room_number) {
            const hasRoomConflict = await checkOverlap(supabase, "room_number", data.room_number, data.day_of_week, data.start_time, data.end_time)
            if (hasRoomConflict) return { success: false, error: `Room ${data.room_number} is occupied at this time.` }
        }

        // Insert
        const { error } = await supabase.from("timetable").insert(data)

        if (error) {
            console.error("Error creating timetable entry:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/timetable")
        return { success: true, message: "Class scheduled successfully" }
    } catch (e: any) {
        console.error("Critical error in createTimetableEntry:", e)
        return { success: false, error: "An unexpected error occurred." }
    }
}

export async function deleteTimetableEntry(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("timetable").delete().eq("id", id)

    if (error) {
        console.error("Error deleting timetable entry:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/timetable")
    return { success: true, message: "Entry deleted successfully" }
}

// Helper for overlap detection
async function checkOverlap(supabase: any, column: string, value: string, day: number, start: string, end: string) {
    const { data } = await supabase
        .from("timetable")
        .select("start_time, end_time")
        .eq(column, value)
        .eq("day_of_week", day)

    if (!data) return false

    // Check overlap: (StartA < EndB) and (EndA > StartB)
    return data.some((entry: any) => {
        return entry.start_time < end && entry.end_time > start
    })
}
