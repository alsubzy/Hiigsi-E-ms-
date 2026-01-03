import { PaymentForm } from "@/components/dashboard/accounting/payment-form"
import { RecentPaymentsTable } from "@/components/dashboard/accounting/recent-payments-table"
import { createClient } from "@/lib/supabase/server"

export default async function FeeCollectionPage() {
    const supabase = await createClient()

    const { data: recentPayments } = await supabase
        .from("accounting_payments")
        .select("*, students(first_name, last_name), invoices(invoice_no)")
        .order("created_at", { ascending: false })
        .limit(10)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-4">
                <PaymentForm />
            </div>
            <div className="lg:col-span-8 h-full">
                <RecentPaymentsTable payments={recentPayments || []} />
            </div>
        </div>
    )
}
