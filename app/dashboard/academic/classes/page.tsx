import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { ClassesClient } from "@/components/academic/classes-client"
import { getClasses } from "@/app/actions/classes"

export default async function ClassesPage() {
    const supabase = await createClient()

    // Verify Admin Access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    if (profile?.role !== "admin") redirect("/dashboard")

    // Fetch Data
    const { data: classes } = await getClasses()

    return (
        <>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ClassesClient
                    initialClasses={classes || []}
                />
            </div>
        </>
    )
}
