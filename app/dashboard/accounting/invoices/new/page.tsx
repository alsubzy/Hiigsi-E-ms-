import { getAccounts, getStudentFees } from "@/app/actions/accounting"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewInvoicePage() {
    const supabase = await createClient()

    // Fetch students with pending fees
    const { data: students } = await supabase
        .from("students")
        .select("id, full_name, grade")
        .eq("status", "active")

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/accounting/invoices">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Student</label>
                            <select className="w-full p-2 border rounded-md">
                                <option>Select a student...</option>
                                {students?.map(s => (
                                    <option key={s.id} value={s.id}>{s.full_name} ({s.grade})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date</label>
                            <input type="date" className="w-full p-2 border rounded-md" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes</label>
                            <textarea className="w-full p-2 border rounded-md" placeholder="Optional invoice notes..."></textarea>
                        </div>

                        <Button className="w-full">
                            <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-muted/10">
                    <CardHeader>
                        <CardTitle className="text-sm">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Select a student and items to see the invoice summary.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
