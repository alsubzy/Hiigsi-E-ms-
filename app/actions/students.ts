"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Student } from "@/lib/types"

export async function getStudents() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("students").select("*").order("roll_number", { ascending: true })

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

export async function createStudent(studentData: Omit<Student, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient()

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

export async function updateStudent(id: string, studentData: Partial<Omit<Student, "id" | "created_at">>) {
  const supabase = await createClient()

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
