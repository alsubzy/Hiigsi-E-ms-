"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Users, Search, CheckCircle2, AlertCircle } from "lucide-react"
import { getStudents } from "@/app/actions/students"
import { getFeeStructures, assignFeesToStudents } from "@/app/actions/accounting"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"

export function BulkFeeAssignment({ onSuccess }: { onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    // Data
    const [students, setStudents] = useState<any[]>([])
    const [feeStructures, setFeeStructures] = useState<any[]>([])

    // Form Selection
    const [selectedStructureId, setSelectedStructureId] = useState("")
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
    const [discountAmount, setDiscountAmount] = useState(0)
    const [discountReason, setDiscountReason] = useState("")
    const [studentSearch, setStudentSearch] = useState("")

    useEffect(() => {
        if (isOpen) {
            fetchData()
        }
    }, [isOpen])

    async function fetchData() {
        try {
            const [stData, fsData] = await Promise.all([
                getStudents(),
                getFeeStructures()
            ])
            setStudents(stData)
            setFeeStructures(fsData)
        } catch (error: any) {
            toast.error("Failed to load data: " + error.message)
        }
    }

    const selectedStructure = feeStructures.find(f => f.id === selectedStructureId)

    const filteredStudents = students.filter(s => {
        // Safe access to student class ID via section relation
        const studentClassId = s.section?.class?.id || (s.classes as any)?.id
        const matchesClass = selectedStructure ? studentClassId === selectedStructure.class_id : true
        const matchesSearch = s.first_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.last_name?.toLowerCase().includes(studentSearch.toLowerCase())
        return matchesClass && matchesSearch
    })

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudentIds(filteredStudents.map(s => s.id))
        } else {
            setSelectedStudentIds([])
        }
    }

    const handleToggleStudent = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    async function handleAssign() {
        if (!selectedStructureId || selectedStudentIds.length === 0) return

        setIsLoading(true)
        try {
            await assignFeesToStudents({
                studentIds: selectedStudentIds,
                feeStructureId: selectedStructureId,
                discount_amount: discountAmount,
                discount_reason: discountReason
            })
            toast.success(`Successfully assigned fees to ${selectedStudentIds.length} students`)
            setIsOpen(false)
            onSuccess()
            // Reset
            setStep(1)
            setSelectedStudentIds([])
            setSelectedStructureId("")
            setDiscountAmount(0)
            setDiscountReason("")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="font-semibold gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Bulk Assign Fees
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-blue-600 p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black flex items-center gap-3">
                            <Users className="w-8 h-8" />
                            Bulk Fee Assignment
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 font-medium text-lg mt-2">
                            Assign mandatory or elective fees to multiple students at once.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-4 mt-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-white text-blue-600' : 'bg-blue-500 text-blue-200'}`}>
                                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                <span className={`text-sm font-bold ${step === s ? 'text-white' : 'text-blue-300'}`}>
                                    {s === 1 ? 'Fee Structure' : s === 2 ? 'Students' : 'Review'}
                                </span>
                                {s < 3 && <div className="w-8 h-px bg-blue-400 mx-2" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-white dark:bg-slate-900 min-h-[400px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Select Fee Template</Label>
                                <Select value={selectedStructureId} onValueChange={setSelectedStructureId}>
                                    <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 font-bold text-lg px-6">
                                        <SelectValue placeholder="Choose a fee structure..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                        {feeStructures.map((fs) => (
                                            <SelectItem key={fs.id} value={fs.id} className="py-3 rounded-xl focus:bg-blue-50">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{fs.fee_categories?.name} - Class {fs.classes?.name || fs.class_name}</span>
                                                    <span className="text-xs text-gray-500">{fs.academic_years?.name} • {fs.terms?.name} • ${Number(fs.amount).toLocaleString()}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedStructure && (
                                <Card className="p-6 bg-blue-50/50 border-blue-100 rounded-2xl">
                                    <div className="flex items-start gap-4 text-blue-800">
                                        <AlertCircle className="w-6 h-6 mt-1" />
                                        <div>
                                            <p className="font-bold text-lg">Selected Format Details</p>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Status</p>
                                                    <p className="font-bold">{selectedStructure.is_mandatory ? 'Mandatory' : 'Optional'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Base Amount</p>
                                                    <p className="font-bold text-xl">${Number(selectedStructure.amount).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        placeholder="Search by student name..."
                                        className="pl-12 h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-medium"
                                        value={studentSearch}
                                        onChange={e => setStudentSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <Checkbox
                                        id="select-all"
                                        onCheckedChange={handleSelectAll}
                                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                                    />
                                    <Label htmlFor="select-all" className="font-bold cursor-pointer">Select All ({filteredStudents.length})</Label>
                                </div>
                            </div>

                            <ScrollArea className="h-[300px] border border-gray-100 rounded-2xl p-4 bg-gray-50/20">
                                <div className="space-y-2">
                                    {filteredStudents.length === 0 ? (
                                        <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                                            <Users className="w-12 h-12 opacity-20 mb-2" />
                                            <p className="font-bold text-lg">No students found</p>
                                            <p className="text-xs">Ensure students are enrolled in Class {selectedStructure?.classes?.name || selectedStructure?.class_name}</p>
                                        </div>
                                    ) : (
                                        filteredStudents.map((s) => (
                                            <div key={s.id}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${selectedStudentIds.includes(s.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:border-gray-200'}`}
                                                onClick={() => handleToggleStudent(s.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                                        {s.first_name?.[0]}{s.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{s.first_name} {s.last_name}</p>
                                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">ID: {s.student_id || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <Checkbox checked={selectedStudentIds.includes(s.id)} onCheckedChange={() => { }} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                                    {selectedStudentIds.length} Students Selected
                                </span>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Discount Amount</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">$</span>
                                        <Input
                                            type="number"
                                            className="h-12 pl-8 rounded-2xl border-gray-100 bg-gray-50/50 font-black text-xl text-blue-600"
                                            value={discountAmount}
                                            onChange={e => setDiscountAmount(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Discount Reason</Label>
                                    <Input
                                        placeholder="e.g. Scholarship, Siblings"
                                        className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 font-medium"
                                        value={discountReason}
                                        onChange={e => setDiscountReason(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Card className="p-8 border-dashed border-2 border-gray-100 rounded-3xl bg-slate-50/50">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Assignment Summary</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className="bg-blue-600 text-white font-black px-4 py-1.5 rounded-xl uppercase text-[10px] tracking-widest">{selectedStructure?.fee_categories?.name}</Badge>
                                            <Badge variant="outline" className="font-bold border-gray-200 px-4 py-1.5 rounded-xl">Class {selectedStructure?.classes?.name || selectedStructure?.class_name}</Badge>
                                            <Badge variant="outline" className="font-bold border-gray-200 px-4 py-1.5 rounded-xl">{selectedStudentIds.length} Students</Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 leading-none">Individual Net Amount</p>
                                            <p className="text-3xl font-black text-gray-900">${(Number(selectedStructure?.amount) - discountAmount).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 leading-none">Total Value</p>
                                            <p className="text-3xl font-black text-blue-600">${((Number(selectedStructure?.amount) - discountAmount) * selectedStudentIds.length).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row gap-4">
                    {step > 1 && (
                        <Button
                            variant="ghost"
                            className="rounded-2xl h-14 font-black transition-all"
                            onClick={() => setStep(step - 1)}
                            disabled={isLoading}
                        >
                            Back
                        </Button>
                    )}
                    <div className="flex-1" />
                    {step < 3 ? (
                        <Button
                            className="rounded-2xl h-14 px-12 font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 transition-all"
                            disabled={step === 1 ? !selectedStructureId : selectedStudentIds.length === 0}
                            onClick={() => setStep(step + 1)}
                        >
                            Continue to {step === 1 ? 'Students' : 'Review'}
                        </Button>
                    ) : (
                        <Button
                            className="rounded-2xl h-14 px-12 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-200 transition-all uppercase tracking-widest"
                            onClick={handleAssign}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing Assignment...' : 'Confirm & Finalize'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
