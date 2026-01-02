import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase env variables")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugProfiles() {
    console.log("--- Debugging Profiles Table ---")

    // Check count of profiles
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        console.error("Error fetching profile count:", countError.message)
    } else {
        console.log("Total profiles in DB:", count)
    }

    // Try to fetch current session user profile (will be null in script unless we login)
    // But we can check if we can see ANY profile with the anon key (should be 0 unless public)
    const { data: profiles, error: selectError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .limit(5)

    if (selectError) {
        console.error("Error selecting profiles:", selectError.message)
    } else {
        console.log("Accessible profiles (first 5):", profiles)
    }
}

debugProfiles().catch(console.error)
