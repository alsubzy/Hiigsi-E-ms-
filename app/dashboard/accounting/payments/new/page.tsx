"use client"

import { useState, useEffect } from "react"
import { processPayment } from "@/app/actions/accounting"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format } from "date-fns"
import { Receipt, ArrowLeft, Search, CheckCircle2, DollarSign } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewPaymentPage() {
    const router = useRouter()
    const [students, setStudents] = useState<any[]>([])
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [invoices, setInvoices] = useState<any[]>([])
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        amount: "",
        payment_method: "cash",
        bank_account_id: "",
        payment_date: format(new Date(), "yyyy-MM-dd"),
        notes: ""
    })

    useEffect(() => {
        fetchStudents()
    }, [])

    async function fetchStudents() {
        const supabase = createClient()
        const { data } = await supabase.from("students").select("id, full_name, grade").eq("status", "active")
        setStudents(data || [])
        setIsLoading(false)
    }

    async function handleStudentChange(studentId: string) {
        if (!studentId) {
            setSelectedStudent(null)
            setInvoices([])
            return
        }

        const student = students.find(s => s.id === studentId)
        setSelectedStudent(student)

        // Fetch pending invoices for this student
        const supabase = createClient()
        const { data } = await supabase
            .from("invoices")
            .select("*")
            .eq("student_id", studentId)
            .neq("status", "paid")
            .order("date", { ascending: true })

        setInvoices(data || [])
        setSelectedInvoice(null)
    }

    async function handleInvoiceChange(invoiceId: string) {
        const inv = invoices.find(i => i.id === invoiceId)
        setSelectedInvoice(inv)
        if (inv) {
            setFormData(prev => ({ ...prev, amount: inv.balance_amount.toString() }))
        }
    }

    async function handleSubmit() {
        if (!selectedInvoice || !formData.amount) {
            toast.error("Please select an invoice and enter an amount")
            return
        }

        setIsSubmitting(true)
        try {
            await processPayment({
                invoice_id: selectedInvoice.id,
                amount: Number(formData.amount),
                payment_method: formData.payment_method,
                payment_date: formData.payment_date,
                notes: formData.notes
            })
            toast.success("Payment recorded successfully")
            router.push("/dashboard/accounting/payments")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/accounting/payments">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#1E293B]">Record Student Payment</h1>
                        <p className="text-sm text-muted-foreground font-medium">Capture tuition collection and issue digital receipts</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                1. Identification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-500 uppercase text-[10px]">Select Student</Label>
                                <select
                                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none"
                                    onChange={(e) => handleStudentChange(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Search or select a student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.full_name} — Grade {s.grade}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedStudent && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <Label className="font-bold text-slate-500 uppercase text-[10px]">Pending Invoices</Label>
                                    <div className="grid gap-3">
                                        {invoices.length === 0 ? (
                                            <div className="p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-slate-50">
                                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                                <p className="font-bold">No outstanding invoices for this student</p>
                                            </div>
                                        ) : (
                                            invoices.map(inv => (
                                                <div
                                                    key={inv.id}
                                                    onClick={() => handleInvoiceChange(inv.id)}
                                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedInvoice?.id === inv.id ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                                                        }`}
                                                >
                                                    <div className="flex flex-col">
                                                        <div className="font-black text-slate-800">{inv.invoice_no}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Issued: {format(new Date(inv.date), "dd MMM yyyy")}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-slate-500">Balance</div>
                                                        <div className="font-black text-red-600">${Number(inv.balance_amount).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {selectedInvoice && (
                        <Card className="border-none shadow-sm animate-in fade-in slide-in-from-top-4">
                            <CardHeader className="border-b bg-slate-50/50">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-primary" />
                                    2. Payment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-500 uppercase text-[10px]">Amount Received</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            className="pl-9 h-12 font-black text-lg border-slate-200 rounded-xl"
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-500 uppercase text-[10px]">Date of Collection</Label>
                                    <Input
                                        type="date"
                                        value={formData.payment_date}
                                        className="h-12 font-bold border-slate-200 rounded-xl"
                                        onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-500 uppercase text-[10px]">Payment Method</Label>
                                    <Select value={formData.payment_method} onValueChange={(val) => setFormData({ ...formData, payment_method: val })}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash Payment</SelectItem>
                                            <SelectItem value="bank">Bank Transfer</SelectItem>
                                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-500 uppercase text-[10px]">Reference / Notes</Label>
                                    <Input
                                        placeholder="TRX ID, Check number, etc."
                                        value={formData.notes}
                                        className="h-12 border-slate-200 rounded-xl font-medium"
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm sticky top-6">
                        <CardHeader className="border-b bg-emerald-600 text-white rounded-t-xl">
                            <CardTitle className="text-lg font-black uppercase tracking-widest">Collection Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {!selectedInvoice ? (
                                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <Receipt className="w-8 h-8 opacity-20" />
                                    <p className="font-bold text-center px-4">Select an invoice to finalize collection</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                                            <span>Student</span>
                                            <span className="text-slate-800">{selectedStudent?.full_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                                            <span>Invoice</span>
                                            <span className="text-slate-800">{selectedInvoice?.invoice_no}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                                            <span>Method</span>
                                            <Badge variant="outline" className="font-bold uppercase tracking-widest text-[8px] bg-slate-50 text-slate-600 border-slate-200">
                                                {formData.payment_method.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 space-y-2">
                                        <div className="flex justify-between text-2xl font-black text-emerald-600">
                                            <span>Total</span>
                                            <span>${Number(formData.amount || 0).toLocaleString()}</span>
                                        </div>
                                        <p className="text-[10px] text-center text-muted-foreground font-medium italic mt-4">
                                            Finalizing this action will update the invoice balance and post digital receipts to the General Ledger.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !formData.amount}
                                        className="w-full h-14 rounded-xl font-black text-lg bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200"
                                    >
                                        {isSubmitting ? "Processing..." : "Confirm Collection"}
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
