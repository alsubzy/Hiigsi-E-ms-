import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    const supabase = await createClient()

    const { data: years, error: yearError } = await supabase.from("academic_years").select("*")
    const { data: terms, error: termError } = await supabase.from("terms").select("*")

    return NextResponse.json({
        years,
        yearError,
        terms,
        termError
    })
}
