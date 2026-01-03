"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Student } from "@/lib/types"
import { validateSectionExists, SECTION_REQUIRED_ERROR, INVALID_SECTION_ERROR } from "@/lib/utils/validation"

export async function getStudents() {
  const supabase = await createClient()

  // Fetch students with section and class data
  const { data, error } = await supabase
    .from("students")
    .select(`
      *,
      section:sections(
        id,
        name,
        class:classes(id, name, level)
      )
    `)
    .eq("status", "active")
    .not("section_id", "is", null)
    .order("roll_number", { ascending: true })

  if (error) {
    console.error("Error fetching students:", error)
    return []
  }

  return data as Student[]
}

export async function getStudent(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("students").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching student:", error)
    return null
  }

  return data as Student
}

export async function createStudent(studentData: Omit<Student, "id" | "created_at" | "updated_at" | "section">) {
  const supabase = await createClient()

  // Validate section_id is provided
  if (!studentData.section_id) {
    throw new Error(SECTION_REQUIRED_ERROR)
  }

  // Validate section exists and is active
  const isValidSection = await validateSectionExists(studentData.section_id)
  if (!isValidSection) {
    throw new Error(INVALID_SECTION_ERROR)
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      ...studentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating student:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/students")
  return data as Student
}

export async function updateStudent(id: string, studentData: Partial<Omit<Student, "id" | "created_at" | "section">>) {
  const supabase = await createClient()

  // If section_id is being updated, validate it
  if (studentData.section_id) {
    const isValidSection = await validateSectionExists(studentData.section_id)
    if (!isValidSection) {
      throw new Error(INVALID_SECTION_ERROR)
    }
  }

  const { data, error } = await supabase
    .from("students")
    .update({
      ...studentData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating student:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/students")
  return data as Student
}

export async function getStudentsBySection(sectionId: string) {
  const supabase = await createClient()

  if (!sectionId) {
    return []
  }

  // Fetch students for a specific section with class data
  const { data, error } = await supabase
    .from("students")
    .select(`
      *,
      section:sections(
        id,
        name,
        class:classes(id, name, level)
      )
    `)
    .eq("section_id", sectionId)
    .eq("status", "active")
    .order("roll_number", { ascending: true })

  if (error) {
    console.error("Error fetching students by section:", error)
    return []
  }

  return data as Student[]
}

export async function deleteStudent(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("students").delete().eq("id", id)

  if (error) {
    console.error("Error deleting student:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/students")
  return true
}
