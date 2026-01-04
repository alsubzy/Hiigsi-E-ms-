const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^"|"$/g, '')
    }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectSchema() {
    let output = ""
    const log = (msg) => {
        console.log(msg)
        output += msg + "\n"
    }
    const tables = ['students', 'sections', 'accounting_payments', 'invoices', 'invoice_items', 'student_fees', 'fee_structures', 'academic_years', 'terms', 'fee_categories', 'classes']
    for (const table of tables) {
        log(`\n--- Columns for ${table} ---`)
        // Try a simple query and check the returned keys
        const { data: sample, error: sampleError } = await supabase.from(table).select('*').limit(1)
        if (sample && sample.length > 0) {
            log(Object.keys(sample[0]).join(', '))
        } else if (sampleError) {
            log(`Error inspecting ${table}: ${sampleError.message}`)
        } else {
            // If table is empty, try to get columns from information_schema via a trick or just report empty
            log("No data in table to inspect columns.")
        }
    }
    fs.writeFileSync(path.resolve(process.cwd(), 'scripts/schema_audit.txt'), output)
    console.log("\nResults written to scripts/schema_audit.txt")
}

inspectSchema()
