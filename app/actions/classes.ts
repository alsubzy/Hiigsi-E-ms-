"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// TYPES

export type ClassRange = {
    id: string
    name: string
    level: number
    description?: string
    status: "active" | "inactive" | "archived"
    created_at: string
    sections?: Section[]
}

export type Section = {
    id: string
    class_id: string
    name: string
    capacity: number
    status: "active" | "inactive" | "archived"
    created_at: string
    class?: ClassRange // Joined data
}

// CLASSES (GRADES)

export async function getClasses() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("classes")
        .select(`
      *,
      sections (*)
    `)
        .order("level", { ascending: true })

    if (error) {
        // Return empty if table or relationship doesn't exist yet (migration pending)
        const isMigrationPending =
            error.code === '42P01' || // Table not found
            error.code === 'PGRST200' || // Relationship not found
            error.message.includes("relation \"classes\" does not exist") ||
            error.message.includes("relation \"sections\" does not exist") ||
            error.message.includes("Could not find a relationship between 'classes' and 'sections'")

        if (isMigrationPending) {
            console.warn("Academic Module: Tables or relationships not found. Please ensure you have run the migration SQL scripts in your Supabase SQL Editor.")
            return { success: true, data: [] }
        }

        console.error("Error fetching classes:", JSON.stringify(error, null, 2))
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as ClassRange[] }
}

export async function createClass(data: { name: string; level: number; description?: string }) {
    try {
        const supabase = await createClient()

        // 1. RBAC: Verify User is Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "Unauthorized" }

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (profile?.role !== "admin") {
            return { success: false, error: "Permission denied. Only admins can create classes." }
        }

        // 2. Validation
        if (!data.name || data.name.trim() === "") {
            return { success: false, error: "Class name is required." }
        }
        if (!data.level || isNaN(data.level)) {
            return { success: false, error: "Valid class level is required." }
        }

        // 3. Duplicate Check
        // Enforce unique Name for clarity.
        const { data: existingName, error: checkError } = await supabase.from("classes").select("id").eq("name", data.name).maybeSingle()
        if (checkError) {
            console.error("Check error:", checkError)
            return { success: false, error: "Database error during duplicate check. Please ensure migrations are applied." }
        }

        if (existingName) {
            return { success: false, error: `Class with name "${data.name}" already exists.` }
        }

        const { error } = await supabase.from("classes").insert(data)

        if (error) {
            console.error("Error creating class:", error)
            if (error.code === "23505") { // Unique violation
                return { success: false, error: "A class with this name or level already exists." }
            }
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/classes")
        return { success: true, message: "Class created successfully" }
    } catch (e: any) {
        console.error("Critical error in createClass:", e)
        return { success: false, error: "An unexpected error occurred. Please try again." }
    }
}

export async function updateClass(id: string, data: Partial<ClassRange>) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from("classes").update(data).eq("id", id)

        if (error) {
            console.error("Error updating class:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/classes")
        return { success: true, message: "Class updated successfully" }
    } catch (e: any) {
        console.error("Critical error in updateClass:", e)
        return { success: false, error: "An unexpected error occurred." }
    }
}

export async function deleteClass(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from("classes").delete().eq("id", id)

        if (error) {
            console.error("Error deleting class:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/classes")
        return { success: true, message: "Class deleted successfully" }
    } catch (e: any) {
        console.error("Critical error in deleteClass:", e)
        return { success: false, error: "An unexpected error occurred." }
    }
}

// SECTIONS

export async function getSections(classId?: string) {
    const supabase = await createClient()

    let query = supabase.from("sections").select("*, class:classes(name, level)").order("name", { ascending: true })

    if (classId) {
        query = query.eq("class_id", classId)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching sections:", error)
        if (error.code === 'PGRST204' || error.message.includes("relation \"sections\" does not exist")) {
            return { success: true, data: [] }
        }
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data as Section[] }
}

export async function createSection(data: { class_id: string; name: string; capacity: number }) {
    try {
        const supabase = await createClient()

        // 1. RBAC
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "Unauthorized" }
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (profile?.role !== "admin") return { success: false, error: "Permission denied." }

        // 2. Validation
        if (!data.name || data.name.trim() === "") return { success: false, error: "Section name is required" }
        if (!data.class_id) return { success: false, error: "Class ID is required" }

        // 3. Duplicate Check (Name within Class)
        const { data: existing, error: checkError } = await supabase
            .from("sections")
            .select("id")
            .eq("class_id", data.class_id)
            .eq("name", data.name)
            .maybeSingle()

        if (checkError) {
            return { success: false, error: "Database error during duplicate check." }
        }

        if (existing) {
            return { success: false, error: "Section with this name already exists in this class." }
        }

        const { error } = await supabase.from("sections").insert(data)

        if (error) {
            console.error("Error creating section:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/classes")
        return { success: true, message: "Section created successfully" }
    } catch (e: any) {
        console.error("Critical error in createSection:", e)
        return { success: false, error: "An unexpected error occurred." }
    }
}

export async function deleteSection(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from("sections").delete().eq("id", id)

        if (error) {
            console.error("Error deleting section:", error)
            return { success: false, error: error.message }
        }

        revalidatePath("/dashboard/academic/classes")
        return { success: true, message: "Section deleted successfully" }
    } catch (e: any) {
        console.error("Critical error in deleteSection:", e)
        return { success: false, error: "An unexpected error occurred." }
    }
}
