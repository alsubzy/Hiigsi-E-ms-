import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { Header } from "@/components/dashboard/header"
import { StudentsClient } from "@/components/students/students-client"
import { getStudents } from "@/app/actions/students"
import { getClasses } from "@/app/actions/classes"

export default async function StudentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  // Check if user has permission to view students
  if (!["admin", "teacher", "staff"].includes(profile.role)) {
    redirect("/dashboard")
  }

  const students = await getStudents()
  const classesRes = await getClasses()
  const classes = classesRes.success ? classesRes.data : []

  return (
    <>
      <Header title="Students" description="Manage student information and records" />
      <StudentsClient students={students} userRole={profile.role} classes={classes || []} />
    </>
  )
}
