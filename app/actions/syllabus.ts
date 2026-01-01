"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// TYPES

export type SyllabusEntry = {
    id: string
    class_id: string
    subject_id: string
    title: string
    description?: string
    file_url?: string
    academic_year_id: string
    created_at: string
    class?: { name: string }
    subject?: { name: string; code: string }
}

export async function getSyllabus(filters?: { classId?: string; subjectId?: string; academicYearId?: string }) {
    const supabase = await createClient()

    let query = supabase
        .from("syllabus")
        .select(`
      *,
      class:classes(name),
      subject:subjects(name, code)
    `)
        .order("created_at", { ascending: false })

    if (filters?.academicYearId) {
        query = query.eq("academic_year_id", filters.academicYearId)
    }
    if (filters?.classId) {
        query = query.eq("class_id", filters.classId)
    }
    if (filters?.subjectId) {
        query = query.eq("subject_id", filters.subjectId)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching syllabus:", error)
        if (error.code === 'PGRST204' || error.message.includes("relation \"syllabus\" does not exist")) {
            return { success: true, data: [] }
        }
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as SyllabusEntry[] }
}

export async function createSyllabusEntry(data: {
    class_id: string
    subject_id: string
    title: string
    description?: string
    file_url?: string
    academic_year_id: string
}) {
    try {
        const supabase = await createClient()

        // 1. RBAC (Admin or Teacher)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "Unauthorized" }
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (profile?.role !== "admin" && profile?.role !== "teacher") {
            return { success: false, error: "Permission denied." }
        }

        // 2. Validation
        if (!data.title || data.title.trim() === "") return { success: false, error: "Title is required" }
        if (!data.class_id || !data.subject_id) return { success: false, error: "Class and Subject are required" }

        const { error } = await supabase.from("syllabus").insert(data)

        if (error) {
            console.error("Error creating syllabus:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/syllabus")
        return { success: true, message: "Syllabus uploaded successfully" }
    } catch (e: any) {
        console.error("Critical error in createSyllabusEntry:", e)
        return { success: false, error: "An unexpected error occurred." }
    }
}

export async function deleteSyllabusEntry(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("syllabus").delete().eq("id", id)

    if (error) {
        console.error("Error deleting syllabus:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/syllabus")
    return { success: true, message: "Syllabus deleted successfully" }
}
