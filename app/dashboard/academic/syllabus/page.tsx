import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { SyllabusClient } from "@/components/academic/syllabus-client"
import { getSyllabus } from "@/app/actions/syllabus"
import { getClasses } from "@/app/actions/classes"
import { getSubjects } from "@/app/actions/subjects"
import { getAcademicYears } from "@/app/actions/academic"

export default async function SyllabusPage() {
    const supabase = await createClient()

    // Verify Access (Admin & Teacher)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (profile?.role !== "admin" && profile?.role !== "teacher") redirect("/dashboard")

    // Fetch Data
    const [syllabusRes, classesRes, subjectsRes, yearsRes] = await Promise.all([
        getSyllabus(),
        getClasses(),
        getSubjects(),
        getAcademicYears()
    ])

    return (
        <>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <SyllabusClient
                    initialSyllabus={syllabusRes.data || []}
                    classes={classesRes.data || []}
                    subjects={subjectsRes.data || []}
                    academicYears={yearsRes.data || []}
                />
            </div>
        </>
    )
}
