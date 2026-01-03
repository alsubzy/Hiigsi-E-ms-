import { createClient } from "@/lib/supabase/server"
import type { Student } from "@/lib/types"

/**
 * Gets students filtered by class and section
 * @param classId - Optional class ID to filter by
 * @param sectionId - Optional section ID to filter by
 * @returns Array of students matching the filters
 */
export async function getFilteredStudents(filters?: {
    classId?: string
    sectionId?: string
    status?: "active" | "inactive"
}) {
    const supabase = await createClient()

    let query = supabase
        .from("students")
        .select(`
      *,
      section:sections(
        id,
        name,
        class_id,
        class:classes(id, name, level)
      )
    `)

    // Apply filters
    if (filters?.sectionId) {
        query = query.eq("section_id", filters.sectionId)
    }

    if (filters?.status) {
        query = query.eq("status", filters.status)
    } else {
        query = query.eq("status", "active") // Default to active students
    }

    query = query.order("roll_number", { ascending: true })

    const { data, error } = await query

    if (error) {
        console.error("Error fetching filtered students:", error)
        return []
    }

    // If classId is provided but not sectionId, filter by class in memory
    let students = data as Student[]
    if (filters?.classId && !filters?.sectionId) {
        students = students.filter(s => s.section?.class_id === filters.classId)
    }

    return students
}

/**
 * Gets unique classes from students
 * @returns Array of unique class objects
 */
export function getUniqueClasses(students: Student[]) {
    const classMap = new Map()

    students.forEach(student => {
        if (student.section?.class) {
            const cls = student.section.class
            if (!classMap.has(cls.id)) {
                classMap.set(cls.id, cls)
            }
        }
    })

    return Array.from(classMap.values()).sort((a, b) => a.level - b.level)
}

/**
 * Gets unique sections for a specific class from students
 * @param students - Array of students
 * @param classId - Class ID to filter sections by
 * @returns Array of unique section objects for the class
 */
export function getUniqueSectionsForClass(students: Student[], classId: string) {
    const sectionMap = new Map()

    students.forEach(student => {
        if (student.section && student.section.class_id === classId) {
            if (!sectionMap.has(student.section.id)) {
                sectionMap.set(student.section.id, student.section)
            }
        }
    })

    return Array.from(sectionMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}
