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
import { FileText, ArrowLeft, Search, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewInvoicePage() {
    const router = useRouter()
    const [students, setStudents] = useState<any[]>([])
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [pendingFees, setPendingFees] = useState<any[]>([])
    const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"))
    const [notes, setNotes] = useState("")

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
            setPendingFees([])
            return
        }

        const student = students.find(s => s.id === studentId)
        setSelectedStudent(student)

        // Fetch pending fees for this student
        try {
            const allFees = await getStudentFees(studentId)
            // Only show fees that are not already fully invoiced or paid
            // Simplified check for now
            setPendingFees(allFees.filter((f: any) => f.status === 'pending'))
            setSelectedFeeIds([])
        } catch (error: any) {
            toast.error(error.message)
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
            toast.error("Please select a student and at least one fee item")
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
            toast.success("Invoice generated successfully")
            router.push("/dashboard/accounting/invoices")
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
                    <Link href="/dashboard/accounting/invoices">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-[#1E293B]">Create New Invoice</h1>
                        <p className="text-sm text-muted-foreground font-medium">Issue billing for tuition and other school fees</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                Step 1: Select Student
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <select
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none"
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
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-lg">
                                                {selectedStudent.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800">{selectedStudent.full_name}</div>
                                                <div className="text-xs font-bold text-primary uppercase">Grade {selectedStudent.grade}</div>
                                            </div>
                                        </div>
                                        <Badge className="bg-white text-primary border-primary/20 font-bold">Active Student</Badge>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm h-full">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Step 2: Select Fee Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {!selectedStudent ? (
                                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <Search className="w-8 h-8 opacity-20" />
                                    <p className="font-bold">Select a student to see pending fees</p>
                                </div>
                            ) : pendingFees.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">ALL SET</Badge>
                                    <p className="font-bold">No pending fees for this student</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingFees.map(fee => (
                                        <div
                                            key={fee.id}
                                            onClick={() => toggleFee(fee.id)}
                                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedFeeIds.includes(fee.id) ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Checkbox checked={selectedFeeIds.includes(fee.id)} onCheckedChange={() => toggleFee(fee.id)} />
                                                <div>
                                                    <div className="font-bold text-slate-800">{fee.fee_structures?.fee_categories?.name}</div>
                                                    <div className="text-xs text-muted-foreground font-medium">{fee.discount_reason ? `Discount applied: ${fee.discount_reason}` : 'Standard billing'}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-slate-900">${Number(fee.net_amount).toLocaleString()}</div>
                                                {Number(fee.discount_amount) > 0 && (
                                                    <div className="text-[10px] text-emerald-600 font-bold italic">-${fee.discount_amount} Discount</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm sticky top-6">
                        <CardHeader className="border-b bg-slate-900 text-white rounded-t-xl">
                            <CardTitle className="text-lg font-black uppercase tracking-widest">Invoice Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-500 uppercase text-[10px]">Due Date</Label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="font-bold h-11 border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-500 uppercase text-[10px]">Administrative Notes</Label>
                                    <Textarea
                                        placeholder="E.g. Term 1 Balance, Part of scholarship agreement..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="font-medium border-slate-200 rounded-xl min-h-[100px]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <div className="flex justify-between text-sm font-bold text-slate-500">
                                    <span>Subtotal</span>
                                    <span>${totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black text-slate-900 pt-2">
                                    <span>Total Due</span>
                                    <span>${totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || selectedFeeIds.length === 0}
                                className="w-full h-14 rounded-xl font-black text-lg shadow-xl shadow-primary/20"
                            >
                                {isSubmitting ? "Generating..." : "Post & Issue Invoice"}
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground font-medium italic">
                                This will create a receivable in the ledger and notify the student/parent via the system dashboard.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
