import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Preferred for admin tasks if available

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase env variables")
    process.exit(1)
}

// Use service role if available to bypass RLS, otherwise anon
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey)

async function checkStudentFeesSchema() {
    console.log("Checking schema for 'student_fees' table...")

    // 1. Try to insert a dummy row with discount_reason (without committing if possible, but PostgREST via JS SDK commits)
    // Better: Select with empty matches to see if it errors on column selection
    // Or just query the table and look at keys if there is data.

    // Attempt to access the column directly
    const { data, error } = await supabase
        .from('student_fees')
        .select('discount_reason')
        .limit(1)

    console.log("---- START CHECK ----")
    if (error) {
        console.error("❌ ERROR: Could not select 'discount_reason'. Detailed error:", JSON.stringify(error, null, 2))
        if (error.message.includes("does not exist") || error.code === "PGRST200") {
            console.log("--> CONCLUSION: Column 'discount_reason' is LIKELY MISSING or cached schema is stale.")
        }
    } else {
        console.log("✅ SUCCESS: 'discount_reason' column is accessible.")
        // Also check detailed full object
        const { data: fullData } = await supabase.from('student_fees').select('*').limit(1)
        if (fullData && fullData.length > 0) {
            console.log("Sample Data Keys:", Object.keys(fullData[0]))
        }
    }
    console.log("---- END CHECK ----")
}

checkStudentFeesSchema()
