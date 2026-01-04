import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/dashboard/header"
import { AdminView } from "@/components/dashboard/views/admin-view"
import { TeacherView } from "@/components/dashboard/views/teacher-view"
import { getTranslations } from "@/lib/i18n-server"
import { getAdminDashboardData, getTeacherDashboardData, getSystemAlerts } from "@/app/actions/dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">Profile Error</h1>
        <p className="mt-2 text-muted-foreground">Could not load user profile.</p>
      </div>
    )
  }

  const t = await getTranslations()

  // --- ADMIN / STAFF VIEW ---
  if (profile.role === "admin" || profile.role === "staff" || profile.role === "accountant") {
    const [adminData, alerts] = await Promise.all([
      getAdminDashboardData(),
      getSystemAlerts()
    ])

    return (
      <>
        <Header title={`${t.welcomeBack}, ${profile.full_name}`} description={t.loginSubtitle} />
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <AdminView data={adminData as any} alerts={alerts} />
        </div>
      </>
    )
  }

  // --- TEACHER VIEW ---
  if (profile.role === "teacher") {
    const teacherData = await getTeacherDashboardData()
    if (!teacherData) return redirect("/login")

    return (
      <>
        <Header title={`Hello, ${profile.full_name}`} description="Manage your classes and students." />
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <TeacherView data={teacherData as any} />
        </div>
      </>
    )
  }

  // --- FALLBACK / STUDENT VIEW ---
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6">
        <div className="rounded-2xl border border-dashed p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Your dashboard is currently under construction. Please contact support if you believe this is an error.
          </p>
        </div>
      </div>
    </>
  )
}
