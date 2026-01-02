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
import { Receipt, ArrowLeft, Search, CheckCircle2, DollarSign, CreditCard } from "lucide-react"
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
        const { data } = await supabase.from("students").select("id, first_name, last_name, grade").eq("status", "active")

        const formattedData = data?.map(student => ({
            ...student,
            full_name: `${student.first_name} ${student.last_name}`
        })) || []

        setStudents(formattedData)
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
        <div className="max-w-[1200px] mx-auto p-6 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/accounting/payments">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
                    <p className="text-sm text-gray-500">Receive tuition fees and issue receipts.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Step 1: Student & Invoice Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-semibold">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">1</div>
                            Identify Payer
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none"
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
                            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                <Label className="text-xs font-semibold text-gray-500 uppercase">Select Invoice to Pay</Label>
                                {invoices.length === 0 ? (
                                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                        <p className="font-medium text-gray-900">No outstanding invoices</p>
                                        <p className="text-sm text-gray-500">This student is fully paid up.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {invoices.map(inv => (
                                            <div
                                                key={inv.id}
                                                onClick={() => handleInvoiceChange(inv.id)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedInvoice?.id === inv.id
                                                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                                                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-bold text-gray-900">{inv.invoice_no}</div>
                                                    <div className="text-xs font-medium text-gray-500 uppercase mt-0.5">
                                                        Due: {format(new Date(inv.date), "MMM dd, yyyy")}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-semibold text-gray-500 uppercase">Balance</div>
                                                    <div className="text-lg font-bold text-red-600">${Number(inv.balance_amount).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Payment Details */}
                    {selectedInvoice && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 text-primary font-semibold pt-4 border-t border-gray-100">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">2</div>
                                Payment Details
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Amount Received</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            className="pl-10 h-12 text-lg font-bold border-gray-200 rounded-xl"
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Payment Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.payment_date}
                                        className="h-12 font-medium border-gray-200 rounded-xl"
                                        onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Payment Method</Label>
                                    <Select value={formData.payment_method} onValueChange={(val) => setFormData({ ...formData, payment_method: val })}>
                                        <SelectTrigger className="h-12 rounded-xl border-gray-200 font-medium">
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
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Reference / Note</Label>
                                    <Input
                                        placeholder="Receipt #, Cheque ID..."
                                        value={formData.notes}
                                        className="h-12 border-gray-200 rounded-xl font-medium"
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Receipt Preview */}
                <div className="space-y-6">
                    <Card className="border-gray-200 shadow-sm overflow-hidden sticky top-8">
                        <div className="bg-emerald-600 p-4 text-white text-center">
                            <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                                <Receipt className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="font-bold text-lg">Receipt Preview</h3>
                            <p className="text-emerald-100 text-xs">Verify details before saving</p>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            {!selectedInvoice ? (
                                <div className="text-center text-gray-400 py-8">
                                    <p className="text-sm">Select an invoice to generate a receipt preview.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Student</span>
                                            <span className="font-semibold text-gray-900 text-right">{selectedStudent?.full_name}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Invoice Ref</span>
                                            <span className="font-semibold text-gray-900">{selectedInvoice?.invoice_no}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Payment Date</span>
                                            <span className="font-semibold text-gray-900">{format(new Date(formData.payment_date), "MMM dd, yyyy")}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Method</span>
                                            <Badge variant="outline" className="capitalize text-xs font-medium">
                                                {formData.payment_method.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center space-y-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Collected</p>
                                        <p className="text-3xl font-black text-emerald-600">${Number(formData.amount || 0).toLocaleString()}</p>
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !formData.amount}
                                        className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50"
                                    >
                                        {isSubmitting ? "Processing..." : "Confirm Payment"}
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
