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

import { StudentSelect } from "@/components/students/student-select"

export function PaymentForm() {
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [selectedStudentId, setSelectedStudentId] = useState<string>("")
    const [selectedInvoice, setSelectedInvoice] = useState<string>("")
    const [amount, setAmount] = useState("")
    const [method, setMethod] = useState("cash")
    const [bankAccountId, setBankAccountId] = useState("")
    const [reference, setReference] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchBankAccounts()
    }, [])

    async function fetchBankAccounts() {
        const supabase = createClient()
        const { data } = await supabase
            .from("bank_accounts")
            .select("*")
            .eq("is_active", true)
        setBankAccounts(data || [])
    }

    async function handleStudentChange(studentId: string | null) {
        if (!studentId) {
            setSelectedStudentId("")
            setInvoices([])
            setAmount("")
            return
        }

        setSelectedStudentId(studentId)
        const supabase = createClient()
        const { data } = await supabase
            .from("invoices")
            .select("*")
            .eq("student_id", studentId)
            .neq("status", "paid")
            .order("date", { ascending: true })

        setInvoices(data || [])
        if (data && data.length > 0) {
            setSelectedInvoice(data[0].id)
            setAmount((data[0].total_amount - data[0].paid_amount).toString())
        } else {
            setSelectedInvoice("")
            setAmount("")
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedInvoice || !amount || !selectedStudentId) {
            toast.error("Please complete all required fields")
            return
        }

        console.log("[PaymentForm] Submitting Payment:", {
            invoice_id: selectedInvoice,
            student_id: selectedStudentId,
            amount,
            method,
            date
        })

        setIsLoading(true)
        try {
            const result = await processPayment({
                invoice_id: selectedInvoice,
                amount: Number(amount),
                payment_method: method,
                bank_account_id: method !== "cash" ? bankAccountId : undefined,
                payment_date: date,
                notes: reference ? `Ref: ${reference}` : "Fee Collection"
            })
            console.log("[PaymentForm] Payment Result:", result)
            toast.success("Payment Recorded", {
                description: `Received $${Number(amount).toLocaleString()} ${reference ? `(Ref: ${reference})` : ""}`
            })
            setAmount("")
            setSelectedStudentId("")
            setSelectedInvoice("")
            setReference("")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-fit">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-1">Record Fee Payment</h2>
            <p className="text-slate-500 text-xs md:text-sm mb-6 md:mb-8">Select a student and record a payment for a fee.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <StudentSelect onSelect={handleStudentChange} selectedId={selectedStudentId} />
                </div>

                {selectedStudentId && (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Unpaid Invoice</Label>
                            <Select value={selectedInvoice} onValueChange={(val) => {
                                setSelectedInvoice(val)
                                const inv = invoices.find(i => i.id === val)
                                if (inv) setAmount((inv.total_amount - inv.paid_amount).toString())
                            }}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder={invoices.length === 0 ? "No pending fees" : "Select invoice..."} />
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount ($)</Label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20 font-bold"
                                />
                            </div>
                        </div>

                        {method !== "cash" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Account / Bank</Label>
                                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20">
                                        <SelectValue placeholder="Select account..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankAccounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.account_name} ({acc.bank_name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference / Tx ID</Label>
                                <Input
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="e.g. EVC-123"
                                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/20 transition-all mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? "Recording..." : "Record Payment"}
                        </Button>
                    </>
                )}
            </form>
        </div>
    )
}
