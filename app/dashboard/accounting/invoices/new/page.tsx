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
import { FileText, ArrowLeft, Search, GraduationCap, CheckCircle } from "lucide-react"
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
        <div className="max-w-[1200px] mx-auto p-6 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/accounting/invoices">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
                    <p className="text-sm text-gray-500">Bill students for tuition and other fees.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Selection */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Step 1: Student Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">1</div>
                                Select Student
                            </div>
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
                            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-4 animate-in fade-in">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {selectedStudent.full_name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{selectedStudent.full_name}</div>
                                    <div className="text-xs font-semibold text-blue-600 uppercase">Grade {selectedStudent.grade}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Fee Selection */}
                    {selectedStudent && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary font-semibold">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">2</div>
                                    Select Fees to Invoice
                                </div>
                            </div>

                            {pendingFees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
                                    <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
                                    <p className="font-medium text-gray-900">No pending fees!</p>
                                    <p className="text-sm text-gray-500">This student has no unbilled fee items.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {pendingFees.map(fee => (
                                        <div
                                            key={fee.id}
                                            onClick={() => toggleFee(fee.id)}
                                            className={`group relative p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedFeeIds.includes(fee.id) ? "ring-2 ring-primary border-primary bg-primary/5" : "bg-white hover:border-gray-300"}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <Checkbox
                                                    checked={selectedFeeIds.includes(fee.id)}
                                                    onCheckedChange={() => toggleFee(fee.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold text-gray-900">{fee.fee_structures?.fee_categories?.name}</div>
                                                            <p className="text-sm text-gray-500 mt-1">{fee.description || "Tuition fee for current term"}</p>
                                                            {fee.discount_reason && (
                                                                <Badge variant="secondary" className="mt-2 text-[10px] bg-emerald-50 text-emerald-700">
                                                                    {fee.discount_reason}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-lg text-gray-900">${Number(fee.net_amount).toLocaleString()}</div>
                                                            {Number(fee.discount_amount) > 0 && <span className="text-xs text-emerald-600 font-medium">-${fee.discount_amount} discount</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Preview & Action */}
                <div className="space-y-6">
                    <Card className="border-gray-200 shadow-sm overflow-hidden sticky top-8">
                        <div className="bg-gray-50 border-b border-gray-100 p-4">
                            <h3 className="font-bold text-gray-900">Invoice Summary</h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Due Date</Label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase">Notes (Optional)</Label>
                                    <Textarea
                                        placeholder="Add a note to this invoice..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="resize-none min-h-[80px]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal ({selectedFeeIds.length} items)</span>
                                    <span className="font-medium">${totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-end pt-2">
                                    <span className="font-bold text-gray-900 pb-1">Total Due</span>
                                    <span className="text-3xl font-bold text-gray-900 tracking-tight">${totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || selectedFeeIds.length === 0}
                                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? "Creating Invoice..." : "Create Invoice"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
