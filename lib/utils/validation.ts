import { createClient } from "@/lib/supabase/server"

/**
 * Validates that a class exists and is active
 * @param classId - UUID of the class to validate
 * @returns true if class exists and is active, false otherwise
 */
export async function validateClassExists(classId: string): Promise<boolean> {
    if (!classId) return false

    const supabase = await createClient()
    const { data, error } = await supabase
        .from("classes")
        .select("id")
        .eq("id", classId)
        .eq("status", "active")
        .single()

    return !error && !!data
}

/**
 * Gets a class by ID with full details
 * @param classId - UUID of the class
 * @returns Class object or null if not found
 */
export async function getClassById(classId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .eq("status", "active")
        .single()

    if (error) return null
    return data
}

/**
 * Validates multiple class IDs at once
 * @param classIds - Array of class UUIDs to validate
 * @returns Array of valid class IDs
 */
export async function validateMultipleClasses(classIds: string[]): Promise<string[]> {
    if (!classIds || classIds.length === 0) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from("classes")
        .select("id")
        .in("id", classIds)
        .eq("status", "active")

    if (error || !data) return []
    return data.map(c => c.id)
}

/**
 * Validates that a section exists and is active
 * @param sectionId - UUID of the section to validate
 * @returns true if section exists and is active, false otherwise
 */
export async function validateSectionExists(sectionId: string): Promise<boolean> {
    if (!sectionId) return false

    const supabase = await createClient()
    const { data, error } = await supabase
        .from("sections")
        .select("id")
        .eq("id", sectionId)
        .eq("status", "active")
        .single()

    return !error && !!data
}

/**
 * Gets a section with its class information
 * @param sectionId - UUID of the section
 * @returns Section object with class data or null if not found
 */
export async function getSectionWithClass(sectionId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("sections")
        .select(`
      *,
      class:classes(id, name, level)
    `)
        .eq("id", sectionId)
        .eq("status", "active")
        .single()

    if (error) return null
    return data
}

/**
 * Gets all active sections for a specific class
 * @param classId - UUID of the class
 * @returns Array of sections
 */
export async function getSectionsForClass(classId: string) {
    if (!classId) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from("sections")
        .select("*")
        .eq("class_id", classId)
        .eq("status", "active")
        .order("name")

    if (error) return []
    return data
}

/**
 * Error message for invalid class reference
 */
export const INVALID_CLASS_ERROR = "Invalid class reference. Please select a valid class from the list."

/**
 * Error message for missing class
 */
export const CLASS_REQUIRED_ERROR = "Class selection is required."

/**
 * Error message for invalid section reference
 */
export const INVALID_SECTION_ERROR = "Invalid section reference. Please select a valid section from the list."

/**
 * Error message for missing section
 */
export const SECTION_REQUIRED_ERROR = "Section selection is required."
