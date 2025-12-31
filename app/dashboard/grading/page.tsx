import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { GradingClient } from "@/components/grading/grading-client"

export default async function GradingPage() {
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

  // Check if user has permission to manage grades
  if (!["admin", "teacher"].includes(profile.role)) {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout user={profile}>
      <Header title="Grading & Report Cards" description="Enter grades and generate report cards" />
      <GradingClient userRole={profile.role} />
    </DashboardLayout>
  )
}
