"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAttendanceByDate(date: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("attendance")
    .select(
      `
      *,
      students:student_id (*)
    `,
    )
    .eq("date", date)

  if (error) {
    console.error("Error fetching attendance:", error)
    return []
  }

  return data
}

export async function markAttendance(studentId: string, date: string, status: string, notes?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        student_id: studentId,
        date,
        status,
        notes: notes || null,
        marked_by: user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,date",
      },
    )
    .select()

  if (error) {
    console.error("Error marking attendance:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/attendance")
  return data
}

export async function getAttendanceStats(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("attendance").select("status").gte("date", startDate).lte("date", endDate)

  if (error) {
    console.error("Error fetching attendance stats:", error)
    return { total: 0, present: 0, absent: 0, late: 0, excused: 0 }
  }

  const stats = {
    total: data.length,
    present: data.filter((a) => a.status === "present").length,
    absent: data.filter((a) => a.status === "absent").length,
    late: data.filter((a) => a.status === "late").length,
    excused: data.filter((a) => a.status === "excused").length,
  }

  return stats
}
