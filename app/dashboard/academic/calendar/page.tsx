import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { CalendarClient } from "@/components/academic/calendar-client"
import { getAcademicYears, getTerms } from "@/app/actions/academic"

export default async function CalendarPage() {
    const supabase = await createClient()

    // Verify Admin Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (profile?.role !== "admin") redirect("/dashboard")

    // Fetch Data
    const [yearsRes, termsRes] = await Promise.all([
        getAcademicYears(),
        getTerms()
    ])

    return (
        <>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CalendarClient
                    years={yearsRes.data || []}
                    terms={termsRes.data || []}
                />
            </div>
        </>
    )
}
