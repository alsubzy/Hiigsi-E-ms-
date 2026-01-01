const { createClient } = require("@supabase/supabase-js")
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase env variables")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
    console.log("Checking schema for 'subjects' table...")

    // Attempt to select from subjects to see columns
    const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .limit(1)

    if (error) {
        console.error("Error fetching subjects:", JSON.stringify(error, null, 2))
    } else {
        console.log("Columns found in 'subjects' table:")
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]))
        } else {
            console.log("No data found, trying to get column names via select(description)...")
            const { error: descError } = await supabase.from('subjects').select('description').limit(1)
            if (descError) {
                console.error("Column 'description' NOT FOUND:", descError.message)
            } else {
                console.log("Column 'description' FOUND.")
            }

            console.log("Checking for 'credits'...")
            const { error: credError } = await supabase.from('subjects').select('credits').limit(1)
            if (credError) {
                console.error("Column 'credits' NOT FOUND:", credError.message)
            } else {
                console.log("Column 'credits' FOUND.")
            }
        }
    }
}

checkSchema()
