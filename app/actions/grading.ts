"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getSubjectsByGrade(grade: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("subjects").select("*").eq("grade", grade).order("name")

  if (error) {
    console.error("Error fetching subjects:", error)
    return []
  }

  return data
}

export async function getGradesByStudent(studentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("grades")
    .select(
      `
      *,
      subjects:subject_id (*)
    `,
    )
    .eq("student_id", studentId)
    .order("term")

  if (error) {
    console.error("Error fetching grades:", error)
    return []
  }

  return data
}

export async function saveGrade(studentId: string, subjectId: string, term: string, marks: number, remarks?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Calculate letter grade
  let grade = "F"
  if (marks >= 90) grade = "A+"
  else if (marks >= 85) grade = "A"
  else if (marks >= 80) grade = "A-"
  else if (marks >= 75) grade = "B+"
  else if (marks >= 70) grade = "B"
  else if (marks >= 65) grade = "B-"
  else if (marks >= 60) grade = "C+"
  else if (marks >= 55) grade = "C"
  else if (marks >= 50) grade = "D"

  const { data, error } = await supabase
    .from("grades")
    .upsert(
      {
        student_id: studentId,
        subject_id: subjectId,
        term,
        marks,
        grade,
        remarks: remarks || null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,subject_id,term",
      },
    )
    .select()

  if (error) {
    console.error("Error saving grade:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/grading")
  return data
}

export async function getReportCard(studentId: string, term: string) {
  const supabase = await createClient()

  const { data: student } = await supabase.from("students").select("*").eq("id", studentId).single()

  const { data: grades } = await supabase
    .from("grades")
    .select(
      `
      *,
      subjects:subject_id (*)
    `,
    )
    .eq("student_id", studentId)
    .eq("term", term)

  if (!student || !grades) {
    return null
  }

  const totalMarks = grades.reduce((sum, g) => sum + Number(g.marks), 0)
  const avgMarks = grades.length > 0 ? totalMarks / grades.length : 0

  return {
    student,
    grades,
    totalMarks,
    avgMarks,
    overallGrade:
      avgMarks >= 90
        ? "A+"
        : avgMarks >= 85
          ? "A"
          : avgMarks >= 80
            ? "A-"
            : avgMarks >= 75
              ? "B+"
              : avgMarks >= 70
                ? "B"
                : avgMarks >= 60
                  ? "C+"
                  : avgMarks >= 50
                    ? "C"
                    : "D",
  }
}
