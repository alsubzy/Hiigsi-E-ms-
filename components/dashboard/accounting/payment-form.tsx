"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { format } from "date-fns"
import { useLanguage } from "@/components/language-provider"
import { processPayment } from "@/app/actions/accounting"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, CreditCard, Banknote, Calendar, Hash, Receipt, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"

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
            toast.success("Payment Recorded", {
                description: `Received $${Number(amount).toLocaleString()} ${reference ? `(Ref: ${reference})` : ""}`,
                className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
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
        <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Wallet size={20} />
                    </div>
                    <CardTitle className="text-xl font-black text-zinc-900 dark:text-white">Record Fee Payment</CardTitle>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Select a student and record a payment for a fee.</p>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Student Identification</Label>
                        <StudentSelect onSelect={handleStudentChange} selectedId={selectedStudentId} />
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedStudentId ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6 overflow-hidden"
                            >
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Select Unpaid Invoice</Label>
                                    <Select value={selectedInvoice} onValueChange={(val) => {
                                        setSelectedInvoice(val)
                                        const inv = invoices.find(i => i.id === val)
                                        if (inv) setAmount((inv.total_amount - inv.paid_amount).toString())
                                    }}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold text-zinc-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <Receipt size={18} className="text-zinc-400" />
                                                <SelectValue placeholder={invoices.length === 0 ? "No pending fees" : "Select invoice..."} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl">
                                            {invoices.map(inv => (
                                                <SelectItem key={inv.id} value={inv.id} className="rounded-xl my-1">
                                                    <div className="flex items-center justify-between w-full gap-4">
                                                        <span className="font-bold">{inv.invoice_no}</span>
                                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-black">
                                                            Bal: ${Number(inv.total_amount - inv.paid_amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Payment Method</Label>
                                        <Select value={method} onValueChange={setMethod}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold">
                                                <div className="flex items-center gap-2 text-zinc-900 dark:text-white lowercase first-letter:uppercase">
                                                    <CreditCard size={18} className="text-zinc-400" />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="cash" className="rounded-xl my-1">Cash</SelectItem>
                                                <SelectItem value="bank_transfer" className="rounded-xl my-1">Bank Transfer</SelectItem>
                                                <SelectItem value="mobile_money" className="rounded-xl my-1">Mobile Money</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Amount ($)</Label>
                                        <div className="relative">
                                            <Banknote size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="h-14 pl-11 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-black text-xl text-blue-600 dark:text-blue-400 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {method !== "cash" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-2"
                                    >
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Account / Bank</Label>
                                        <Select value={bankAccountId} onValueChange={setBankAccountId}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold">
                                                <div className="flex items-center gap-2">
                                                    <Receipt size={18} className="text-zinc-400" />
                                                    <SelectValue placeholder="Select account..." />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {bankAccounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id} className="rounded-xl my-1">
                                                        {acc.account_name} ({acc.bank_name})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Reference / TX ID</Label>
                                        <div className="relative">
                                            <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                value={reference}
                                                onChange={(e) => setReference(e.target.value)}
                                                placeholder="e.g. EVC-123"
                                                className="h-14 pl-11 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Date</Label>
                                        <div className="relative">
                                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                            <Input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="h-14 pl-11 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all mt-4 flex items-center gap-3"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={20} />
                                    )}
                                    {isLoading ? "Synchronizing..." : "Finalize Payment"}
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800"
                            >
                                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700 mb-4">
                                    <ArrowRight size={32} />
                                </div>
                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Awaiting Student Selection</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </CardContent>
        </Card>
    )
}
