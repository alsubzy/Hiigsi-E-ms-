
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    const supabase = await createClient()

    try {
        // 1. Get a student
        const { data: students } = await supabase.from("students").select("*").limit(1)
        if (!students || students.length === 0) {
            return NextResponse.json({ error: "No students found" }, { status: 404 })
        }
        const student = students[0]

        // 2. Get/Create Fee Category
        let { data: cat } = await supabase.from("fee_categories").select("*").eq("name", "Tuition").single()
        if (!cat) {
            // Create dummy account first if needed? No, let's assume one exists or nullable
            // Actually accounts table exists.
            const { data: acc } = await supabase.from("accounts").select("*").eq("type", "income").limit(1).single()

            const { data: newCat, error: catError } = await supabase.from("fee_categories").insert({
                name: "Tuition",
                account_id: acc?.id
            }).select().single()

            if (catError) throw catError
            cat = newCat
        }

        // 3. Get/Create Fee Structure
        // Need academic year first
        let { data: ay } = await supabase.from("academic_years").select("*").eq("status", "active").single()
        if (!ay) {
            // Create one if missing
            const { data: newAy } = await supabase.from("academic_years").insert({
                name: "2025-2026",
                start_date: "2025-01-01",
                end_date: "2026-01-01",
                status: "active",
                is_current: true
            }).select().single()
            ay = newAy
        }

        // Create structure
        let { data: fs } = await supabase.from("fee_structures").select("*").eq("fee_category_id", cat.id).eq("class_name", student.class_name).single()
        if (!fs) {
            const { data: newFs, error: fsError } = await supabase.from("fee_structures").insert({
                fee_category_id: cat.id,
                academic_year_id: ay.id,
                class_name: student.class_name,
                amount: 100.00
            }).select().single()
            if (fsError) throw fsError
            fs = newFs
        }

        // 4. Create Student Fee
        const { data: sf, error: sfError } = await supabase.from("student_fees").insert({
            student_id: student.id,
            fee_structure_id: fs.id,
            amount: 100.00,
            status: 'pending'
        }).select().single()

        if (sfError) throw sfError

        return NextResponse.json({
            success: true,
            student: { id: student.id, name: student.first_name + " " + student.last_name },
            fee: sf
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
