
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AccountingClient } from "@/components/accounting/accounting-client"

export default async function AccountingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  if (profile.role !== "admin" && profile.role !== "accountant") {
    redirect("/dashboard")
  }

  // Fetch students
  const { data: students } = await supabase.from("students").select("*").order("name")

  // Fetch payments with student details
  const { data: payments } = await supabase
    .from("payments")
    .select("*, student:students(name, roll_number, grade, section)")
    .order("payment_date", { ascending: false })

  // Calculate stats
  const totalRevenue = payments?.reduce((acc, curr) => acc + (curr.status === "completed" ? curr.amount : 0), 0) || 0
  const completedPayments = payments?.filter((p) => p.status === "completed").length || 0
  const pendingAmount = payments?.reduce((acc, curr) => acc + (curr.status === "pending" ? curr.amount : 0), 0) || 0
  const pendingPayments = payments?.filter((p) => p.status === "pending").length || 0

  return (
    <DashboardLayout user={profile}>
      <AccountingClient
        initialStudents={students || []}
        initialPayments={payments || []}
        initialStats={{
          totalRevenue,
          completedPayments,
          pendingAmount,
          pendingPayments,
        }}
      />
    </DashboardLayout>
  )
}
