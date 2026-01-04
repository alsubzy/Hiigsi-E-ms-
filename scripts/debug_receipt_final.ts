import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugReceipt() {
    console.log("Fetching recent payments...")
    const { data: payments, error } = await supabase
        .from('accounting_payments')
        .select('id, payment_no, amount')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error("Error fetching payments:", error)
        return
    }

    console.log("Recent Payments:", JSON.stringify(payments, null, 2))

    if (payments && payments.length > 0) {
        const paymentId = payments[0].id
        console.log(`\nTesting getPaymentDetails for ID: ${paymentId}`)

        // Simulating getPaymentDetails query
        const { data: details, error: detailsError } = await supabase
            .from('accounting_payments')
            .select(`
                *,
                students (
                    first_name,
                    last_name,
                    student_id,
                    sections (
                        classes (
                            name
                        )
                    )
                ),
                invoices (
                    invoice_no,
                    total_amount,
                    invoice_items (
                        amount,
                        student_fees (
                            fee_category_id,
                            academic_year_id,
                            term_id,
                            fee_categories (name),
                            academic_years (name),
                            terms (name)
                        )
                    )
                )
            `)
            .eq('id', paymentId)
            .single()

        if (detailsError) {
            console.error("Error in getPaymentDetails query:", detailsError)
        } else {
            console.log("Query Result:", JSON.stringify(details, null, 2))
        }
    }
}

debugReceipt()
