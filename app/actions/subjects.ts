"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ClassRange, Section } from "./classes"
import { AcademicYear } from "./academic"

// TYPES

export type Subject = {
    id: string
    name: string
    code: string
    description?: string
    credits: number
    is_active: boolean
    class_id?: string
    created_at: string
    class?: ClassRange // Joined data
}

export type SubjectTeacher = {
    id: string
    subject_id: string
    section_id: string
    teacher_id: string
    academic_year_id: string
    created_at: string
    subject?: Subject
    section?: Section
    teacher?: { full_name: string; email: string } // Joined profile data
}

// SUBJECTS

export async function getSubjects(classId?: string) {
    const supabase = await createClient()

    let query = supabase
        .from("subjects")
        .select("*, class:classes(name, level)")
        .order("name", { ascending: true })

    if (classId) {
        query = query.eq("class_id", classId)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching subjects:", error)
        if (error.code === 'PGRST204' || error.message.includes("relation \"subjects\" does not exist")) {
            return { success: true, data: [] }
        }
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as Subject[] }
}

export async function createSubject(data: { name: string; code: string; class_id?: string; description?: string; credits?: number }) {
    try {
        const supabase = await createClient()

        // 1. RBAC
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "Unauthorized" }
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (profile?.role !== "admin") return { success: false, error: "Permission denied. Only admins can create subjects." }

        // 2. Validation
        if (!data.name || data.name.trim() === "") return { success: false, error: "Subject name is required" }
        if (!data.code || data.code.trim() === "") return { success: false, error: "Subject code is required" }

        // Check valid class_id if provided
        if (data.class_id && data.class_id !== "none") {
            // keep it
        } else {
            delete data.class_id
        }

        // 3. Duplicate Check
        const { data: existing, error: checkError } = await supabase.from("subjects").select("id").eq("code", data.code).maybeSingle()
        if (checkError) {
            console.error("Duplicate check error:", checkError)
            return { success: false, error: "Database error during code validation." }
        }

        if (existing) {
            return { success: false, error: `Subject with code "${data.code}" already exists.` }
        }

        const { error } = await supabase.from("subjects").insert({
            name: data.name,
            code: data.code,
            class_id: data.class_id,
            description: data.description,
            credits: data.credits || 1
        })

        if (error) {
            console.error("Error creating subject (full details):", JSON.stringify(error, null, 2))
            if (error.code === "23505") return { success: false, error: "Subject code or name already exists." }
            if (error.code === "23502") return { success: false, error: `Missing required field: ${error.message}` }
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/subjects")
        return { success: true, message: "Subject created successfully" }
    } catch (e: any) {
        console.error("Critical error in createSubject:", e)
        return { success: false, error: "An unexpected error occurred." }
    }
}

export async function updateSubject(id: string, data: Partial<Subject>) {
    const supabase = await createClient()

    const updateData = { ...data }
    if (updateData.class_id === "none") {
        updateData.class_id = null as any
    }

    const { error } = await supabase.from("subjects").update(updateData).eq("id", id)

    if (error) {
        console.error("Error updating subject:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/subjects")
    return { success: true, message: "Subject updated successfully" }
}

export async function deleteSubject(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("subjects").delete().eq("id", id)

    if (error) {
        console.error("Error deleting subject:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/subjects")
    return { success: true, message: "Subject deleted successfully" }
}

// ALLOCATIONS (Teacher -> Subject -> Section)

export async function getSubjectTeachers(academicYearId: string, sectionId?: string) {
    const supabase = await createClient()

    let query = supabase
        .from("subject_teachers")
        .select(`
      *,
      subject:subjects(name, code),
      section:sections(name, class:classes(name)),
      teacher:profiles(full_name, email)
    `)
        .eq("academic_year_id", academicYearId)

    if (sectionId) {
        query = query.eq("section_id", sectionId)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching allocations:", error)
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as SubjectTeacher[] }
}

export async function allocateTeacher(data: { subject_id: string; section_id: string; teacher_id: string; academic_year_id: string }) {
    try {
        const supabase = await createClient()

        // Upsert to prevent duplicates or overwrite existing allocation for this subject/section
        // Constraint is UNIQUE(subject_id, section_id, academic_year_id)

        const { error } = await supabase
            .from("subject_teachers")
            .upsert(data, { onConflict: "subject_id, section_id, academic_year_id" })

        if (error) {
            console.error("Error allocating teacher:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/subjects")
        return { success: true, message: "Teacher allocated successfully" }
    } catch (e: any) {
        console.error("Critical error in allocateTeacher:", e)
        return { success: false, error: "An unexpected error occurred." }
    }
}

export async function removeAllocation(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("subject_teachers").delete().eq("id", id)

    if (error) {
        console.error("Error removing allocation:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/dashboard/academic/subjects")
    return { success: true, message: "Allocation removed successfully" }
}
