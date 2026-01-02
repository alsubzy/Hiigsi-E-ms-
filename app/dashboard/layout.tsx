import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
        // If we can't load the profile for the layout, we really can't render the sidebar correctly
        // So we might redirect to login or show a minimal error. 
        // For safety in the layout, we'll redirect if critical data is missing to avoid broken UI loops
        redirect("/login")
    }

    return (
        <DashboardLayout user={profile}>
            {children}
        </DashboardLayout>
    )
}
