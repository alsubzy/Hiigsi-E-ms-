import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { SettingsClient } from "@/components/settings/settings-client"
import { getSchoolSettings } from "@/app/actions/settings"

export default async function SettingsPage() {
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

  const schoolSettings = await getSchoolSettings()

  return (
    <>
      <SettingsClient user={profile} schoolSettings={schoolSettings.data} />
    </>
  )
}
