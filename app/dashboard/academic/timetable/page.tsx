import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TimetableClient } from "@/components/academic/timetable-client"
import { getClasses } from "@/app/actions/classes"
import { getAcademicYears } from "@/app/actions/academic"

export default async function TimetablePage() {
    const supabase = await createClient()

    // Verify Admin Access (Teachers can also view later, but restricted edit)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (profile?.role !== "admin" && profile?.role !== "teacher") redirect("/dashboard")

    // Fetch Data
    const [classesRes, yearsRes] = await Promise.all([
        getClasses(),
        getAcademicYears()
    ])

    return (
        <DashboardLayout user={profile}>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <TimetableClient
                    initialClasses={classesRes.data || []}
                    academicYears={yearsRes.data || []}
                />
            </div>
        </DashboardLayout>
    )
}
