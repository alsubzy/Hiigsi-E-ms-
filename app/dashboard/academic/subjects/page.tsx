import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SubjectsClient } from "@/components/academic/subjects-client"
import { getSubjects } from "@/app/actions/subjects"
import { getClasses } from "@/app/actions/classes"
import { getTeachers } from "@/app/actions/users"
import { getAcademicYears } from "@/app/actions/academic"

export default async function SubjectsPage() {
    const supabase = await createClient()

    // Verify Admin Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    // Teachers can also access this? For now Admin only for management. Teachers strictly "Teach".
    // Let's allow admins only for subject creation/allocation.
    if (profile?.role !== "admin") redirect("/dashboard")

    // Fetch Data
    const [subjectsRes, classesRes, teachersRes, yearsRes] = await Promise.all([
        getSubjects(),
        getClasses(),
        getTeachers(),
        getAcademicYears()
    ])

    return (
        <DashboardLayout user={profile}>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <SubjectsClient
                    initialSubjects={subjectsRes.data || []}
                    classes={classesRes.data || []}
                    teachers={teachersRes.teachers || []}
                    academicYears={yearsRes.data || []}
                    initialAllocations={[]}
                />
            </div>
        </DashboardLayout>
    )
}
