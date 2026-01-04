const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manually read .env
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

async function debugReceipt() {
    console.log("Fetching recent payments...")
    const { data: payments, error } = await supabase
        .from('accounting_payments')
        .select('id, payment_no, amount')
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error("Error fetching payments:", error)
        return
    }

    if (payments && payments.length > 0) {
        const paymentId = payments[0].id
        console.log(`\nTesting getPaymentDetails for ID: ${paymentId}`)

        const { data: details, error: detailsError } = await supabase
            .from('accounting_payments')
            .select(`
                *,
                students (
                    first_name,
                    last_name,
                    roll_number,
                    sections (
                        name,
                        classes (name)
                    )
                ),
                invoices (
                    invoice_no,
                    invoice_items (
                        amount,
                        description,
                        student_fees (
                            academic_years (name),
                            terms (name),
                            fee_structures (
                                class_id,
                                fee_categories (name)
                            )
                        )
                    )
                )
            `)
            .eq('id', paymentId)
            .single()

        if (detailsError) {
            console.error("Error in getPaymentDetails query:", JSON.stringify(detailsError, null, 2))
        } else {
            console.log("Query Result successfully fetched")
            // console.log(JSON.stringify(details, null, 2))
        }
    } else {
        console.log("No payments found to test.")
    }
}

debugReceipt()
