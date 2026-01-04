"use client"

import { useState, useEffect } from "react"
import { getStudentFees, createInvoice } from "@/app/actions/accounting"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { format } from "date-fns"
import { FileText, ArrowLeft, Search, GraduationCap, CheckCircle, Receipt, User, DollarSign, Calendar, AlertCircle, Plus, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { StudentSelect } from "@/components/students/student-select"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function NewInvoicePage() {
    const router = useRouter()
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [pendingFees, setPendingFees] = useState<any[]>([])
    const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFetchingFees, setIsFetchingFees] = useState(false)
    const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"))
    const [notes, setNotes] = useState("")

    async function handleStudentChange(studentId: string | null) {
        if (!studentId) {
            setSelectedStudent(null)
            setPendingFees([])
            return
        }

        setIsFetchingFees(true)
        try {
            const supabase = createClient()
            const { data: student } = await supabase
                .from("students")
                .select("id, first_name, last_name, student_id, sections(classes(name))")
                .eq("id", studentId)
                .single()

            if (student) {
                const sectionData = student.sections as any
                const className = Array.isArray(sectionData)
                    ? sectionData[0]?.classes?.name
                    : sectionData?.classes?.name

                setSelectedStudent({
                    ...student,
                    full_name: `${student.first_name} ${student.last_name}`,
                    class_name: className || "N/A"
                })
            }

            const allFees = await getStudentFees(studentId)
            setPendingFees(allFees.filter((f: any) => f.status === 'pending'))
            setSelectedFeeIds([])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsFetchingFees(false)
        }
    }

    const toggleFee = (feeId: string) => {
        setSelectedFeeIds(prev =>
            prev.includes(feeId) ? prev.filter(id => id !== feeId) : [...prev, feeId]
        )
    }

    const totalAmount = pendingFees
        .filter(f => selectedFeeIds.includes(f.id))
        .reduce((sum, f) => sum + Number(f.net_amount), 0)

    async function handleSubmit() {
        if (!selectedStudent || selectedFeeIds.length === 0) {
            toast.error("Validation Error", {
                description: "Please select a student and at least one fee item to proceed."
            })
            return
        }

        setIsSubmitting(true)
        try {
            await createInvoice({
                student_id: selectedStudent.id,
                fee_ids: selectedFeeIds,
                due_date: dueDate,
                notes
            })
            toast.success("Invoice Generated Successfully", {
                description: `Authorized billing record created for ${selectedStudent.full_name}.`,
                className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
            })
            router.push("/dashboard/accounting/invoices")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/accounting/invoices">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Plus size={16} className="stroke-[3]" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Authorizing Billing</h1>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Create authoritative student financial obligations and ledger entries.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                    {/* Step 1: Identity Selection */}
                    <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-600 dark:text-zinc-400">01</div>
                                <h2 className="text-lg font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200">Student Identity</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-inner">
                                <StudentSelect onSelect={handleStudentChange} />
                            </div>

                            <AnimatePresence mode="wait">
                                {selectedStudent && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-6 rounded-[2rem] bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-2xl shadow-sm border border-blue-100 dark:border-blue-800/20">
                                                {selectedStudent.full_name?.charAt(0)}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-black text-zinc-900 dark:text-white text-lg leading-none">{selectedStudent.full_name}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">Grade {selectedStudent.class_name}</span>
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">REG: {selectedStudent.student_id || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex flex-col items-end opacity-40">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Status</div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Record Active</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>

                    {/* Step 2: Line Item Selection */}
                    <AnimatePresence>
                        {selectedStudent && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden">
                                    <CardHeader className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-600 dark:text-zinc-400">02</div>
                                                <h2 className="text-lg font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200">Specified Charges</h2>
                                            </div>
                                            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                {pendingFees.length} Pending Records Detected
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        {isFetchingFees ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                <div className="w-8 h-8 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scanning Financial Records...</span>
                                            </div>
                                        ) : pendingFees.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                                                    <CheckCircle size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-sm">Account Standardized</p>
                                                    <p className="text-xs text-zinc-500 font-medium italic">This identity currently carries no unbilled ledger items.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {pendingFees.map((fee, index) => (
                                                    <motion.div
                                                        key={fee.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        onClick={() => toggleFee(fee.id)}
                                                        className={cn(
                                                            "group relative p-6 rounded-3xl border transition-all cursor-pointer",
                                                            selectedFeeIds.includes(fee.id)
                                                                ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.01]"
                                                                : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-6">
                                                            <div className={cn(
                                                                "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                                                                selectedFeeIds.includes(fee.id) ? "bg-white border-white text-blue-600" : "border-zinc-200 dark:border-zinc-700"
                                                            )}>
                                                                {selectedFeeIds.includes(fee.id) && <CheckCircle size={14} className="stroke-[3]" />}
                                                            </div>
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="space-y-1">
                                                                        <div className={cn("font-black text-lg transition-colors", selectedFeeIds.includes(fee.id) ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                                                                            {fee.fee_structures?.fee_categories?.name}
                                                                        </div>
                                                                        <div className={cn("text-xs font-medium italic opacity-70", selectedFeeIds.includes(fee.id) ? "text-white" : "text-zinc-500")}>
                                                                            {fee.description || "Tuition fee for current term"}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className={cn("text-2xl font-black tracking-tighter transition-colors", selectedFeeIds.includes(fee.id) ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                                                                            ${Number(fee.net_amount).toLocaleString()}
                                                                        </div>
                                                                        {Number(fee.discount_amount) > 0 && (
                                                                            <div className={cn("text-[9px] font-black uppercase tracking-widest", selectedFeeIds.includes(fee.id) ? "text-blue-100" : "text-emerald-500")}>
                                                                                Includes ${fee.discount_amount} Discount
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Summary Column */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden sticky top-8">
                        <CardHeader className="p-8 bg-zinc-900 dark:bg-zinc-900 text-white border-b-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-sm uppercase tracking-[0.3em] opacity-60">Ledger Summary</h3>
                                <Receipt size={18} className="opacity-40" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Payment Grace Period</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                                        <Input
                                            type="date"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className="h-12 pl-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Administrative Notes</Label>
                                    <Textarea
                                        placeholder="Add internal transaction context..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="resize-none min-h-[120px] rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        <span>Items for Authorization</span>
                                        <span className="text-zinc-600 dark:text-zinc-300">{selectedFeeIds.length} Specified Charge{selectedFeeIds.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        <span>Consolidated Amount</span>
                                        <span className="text-zinc-900 dark:text-white font-mono text-xs">${totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Total Authorization Amount</div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold opacity-30">$</span>
                                        <span className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
                                            {totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || selectedFeeIds.length === 0}
                                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Synchronizing Ledger...
                                    </div>
                                ) : (
                                    "Authorize Invoice"
                                )}
                            </Button>

                            <div className="flex items-center gap-3 px-2 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 opacity-60">
                                <Info size={14} className="text-zinc-400 shrink-0" />
                                <p className="text-[10px] font-medium text-zinc-500 leading-tight">
                                    Authorizing this invoice will create a permanent ledger entry and update the student's outstanding balance.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
