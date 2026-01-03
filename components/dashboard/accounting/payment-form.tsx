"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { useLanguage } from "@/components/language-provider"
import { processPayment } from "@/app/actions/accounting"
import { useRouter } from "next/navigation"

export function PaymentForm() {
    const [students, setStudents] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [selectedStudent, setSelectedStudent] = useState<string>("")
    const [selectedInvoice, setSelectedInvoice] = useState<string>("")
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { t } = useLanguage()

    useEffect(() => {
        fetchStudents()
    }, [])

    async function fetchStudents() {
        const supabase = createClient()
        const { data } = await supabase
            .from("students")
            .select("id, first_name, last_name, class_name")
            .eq("status", "active")
            .order("first_name")

        setStudents(data || [])
    }

    async function handleStudentChange(studentId: string) {
        setSelectedStudent(studentId)
        // Fetch unpaid invoices for selected student
        const supabase = createClient()
        const { data } = await supabase
            .from("invoices")
            .select("*")
            .eq("student_id", studentId)
            .neq("status", "paid")
            .order("date", { ascending: true })

        setInvoices(data || [])
        setSelectedInvoice(data && data.length > 0 ? data[0].id : "")
        if (data && data.length > 0) {
            setAmount((data[0].total_amount - data[0].paid_amount).toString())
        } else {
            setAmount("")
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedInvoice || !amount) {
            toast.error("Please select an invoice and enter amount")
            return
        }

        setIsLoading(true)
        try {
            await processPayment({
                invoice_id: selectedInvoice,
                amount: Number(amount),
                payment_method: "cash", // Default for now as per simple design
                payment_date: date,
                notes: "Fee Collection"
            })
            toast.success("Payment recorded successfully")
            setAmount("")
            setSelectedStudent("")
            setSelectedInvoice("")
            handleStudentChange(selectedStudent) // Refresh invoices
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-fit">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Record Fee Payment</h2>
            <p className="text-slate-500 text-sm mb-8">Select a student and record a payment for a fee.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</Label>
                    <Select value={selectedStudent} onValueChange={handleStudentChange}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select student..." />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map(student => (
                                <SelectItem key={student.id} value={student.id}>
                                    {student.first_name} {student.last_name} ({student.class_name})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fee Type (Invoice)</Label>
                    <Select value={selectedInvoice} onValueChange={(val) => {
                        setSelectedInvoice(val)
                        const inv = invoices.find(i => i.id === val)
                        if (inv) setAmount((inv.total_amount - inv.paid_amount).toString())
                    }}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder={invoices.length === 0 ? "No pending fees" : "Select fee..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {invoices.map(inv => (
                                <SelectItem key={inv.id} value={inv.id}>
                                    {inv.invoice_no} — Bal: ${Number(inv.total_amount - inv.paid_amount).toLocaleString()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount Paid ($)</Label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Date</Label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/20 transition-all mt-4"
                    disabled={isLoading}
                >
                    {isLoading ? "Recording..." : "Record Payment"}
                </Button>
            </form>
        </div>
    )
}
