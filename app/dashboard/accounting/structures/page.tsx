"use client"

import { useState, useEffect } from "react"
import { getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure, getFeeCategories, getAcademicYears, getTerms } from "@/app/actions/accounting"
import { getClasses } from "@/app/actions/classes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Activity, Edit2, Trash2, AlertCircle, LayoutGrid, DollarSign, Tag } from "lucide-react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function FeeStructuresPage() {
    const [classes, setClasses] = useState<any[]>([])
    const [structures, setStructures] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [academicYears, setAcademicYears] = useState<any[]>([])
    const [terms, setTerms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedStructure, setSelectedStructure] = useState<any>(null)
    const [structureToDelete, setStructureToDelete] = useState<any>(null)

    const [formData, setFormData] = useState({
        fee_category_id: "",
        academic_year_id: "",
        term_id: "",
        grade: "",
        amount: "",
        is_mandatory: true,
        due_date: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [structData, catData, yearData, classRes] = await Promise.all([
                getFeeStructures(),
                getFeeCategories(),
                getAcademicYears(),
                getClasses()
            ])
            setStructures(structData)
            setCategories(catData)
            setAcademicYears(yearData)
            if (classRes.success && classRes.data) {
                setClasses(classRes.data)
            }

            if (yearData.length === 0) {
                toast.error("No Academic Years found. Please create one in Settings.", { duration: 5000 })
            }

            // Find current year (support both is_current and is_active due to schema differences)
            const currentYear = yearData.find((y: any) => y.is_current || y.is_active) || yearData[0]

            if (currentYear) {
                // If we don't have a year selected in formData, default to current one
                if (!formData.academic_year_id) {
                    setFormData(prev => ({ ...prev, academic_year_id: currentYear.id }))
                }

                try {
                    const termData = await getTerms(currentYear.id)
                    setTerms(termData)
                    // If we don't have a term selected, default to first or current one
                    if (!formData.term_id && termData.length > 0) {
                        const currentTerm = termData.find((t: any) => t.is_current || t.is_active) || termData[0]
                        setFormData(prev => ({ ...prev, term_id: currentTerm.id }))
                    }
                } catch (termError) {
                    console.error("Failed to fetch terms", termError)
                    // Don't block the whole page if terms fail
                }
            } else {
                // Should not happen if yearData has items, but just in case
                if (yearData.length > 0) toast.warning("No active academic year found.")
            }

            // Default category if none selected
            if (catData.length > 0 && !formData.fee_category_id) {
                setFormData(prev => ({ ...prev, fee_category_id: catData[0].id }))
            }
        } catch (error: any) {
            console.error("Fetch Data Error:", error)
            toast.error("Failed to load data: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            fee_category_id: "",
            academic_year_id: "",
            term_id: "",
            grade: "",
            amount: "",
            is_mandatory: true,
            due_date: ""
        })
        setSelectedStructure(null)
    }

    const handleEdit = async (struct: any) => {
        setSelectedStructure(struct)
        setFormData({
            fee_category_id: struct.fee_category_id,
            academic_year_id: struct.academic_year_id,
            term_id: struct.term_id,
            grade: struct.grade,
            amount: struct.amount.toString(),
            is_mandatory: struct.is_mandatory,
            due_date: struct.due_date ? new Date(struct.due_date).toISOString().split('T')[0] : ""
        })

        // Fetch terms for the selected academic year
        const termData = await getTerms(struct.academic_year_id)
        setTerms(termData)

        setIsDialogOpen(true)
    }

    const handleYearChange = async (yearId: string) => {
        setFormData({ ...formData, academic_year_id: yearId, term_id: "" })
        try {
            const termData = await getTerms(yearId)
            setTerms(termData)
            if (termData.length > 0) {
                // Auto-select active term if possible
                const currentTerm = termData.find((t: any) => t.is_current || t.is_active) || termData[0]
                setFormData(prev => ({ ...prev, term_id: currentTerm.id }))
            }
        } catch (error: any) {
            toast.error("Failed to load terms: " + error.message)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.academic_year_id || !formData.term_id || !formData.fee_category_id || !formData.grade || !formData.amount) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)

        const payload = {
            fee_category_id: formData.fee_category_id,
            academic_year_id: formData.academic_year_id,
            term_id: formData.term_id,
            class_name: formData.grade, // Map grade selection to class_name
            amount: parseFloat(formData.amount),
            due_date: formData.due_date || undefined,
            is_mandatory: formData.is_mandatory
        }

        try {
            if (selectedStructure) {
                await updateFeeStructure(selectedStructure.id, payload)
                toast.success("Fee structure updated successfully")
            } else {
                await createFeeStructure(payload)
                toast.success("Fee structure created successfully")
            }
            setIsDialogOpen(false)
            fetchData()
            resetForm()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!structureToDelete) return
        setIsSubmitting(true)
        try {
            await deleteFeeStructure(structureToDelete.id)
            toast.success("Fee structure deleted successfully")
            setIsDeleteDialogOpen(false)
            fetchData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
            setStructureToDelete(null)
        }
    }

    const filteredStructures = structures.filter(s =>
        s.fee_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.grade?.toLowerCase().includes(searchTerm.toLowerCase())
    )



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Fee Structures</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-0.5">Define Base Pricing per Grade & Term</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) resetForm()
                    }}>
                        <DialogTrigger asChild>
                            <Button className="font-bold gap-2 shadow-lg shadow-primary/20 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4" /> New Structure
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black">{selectedStructure ? "Edit Structure" : "New Fee Structure"}</DialogTitle>
                                    <DialogDescription>
                                        Define a template for student billing.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="year" className="text-xs font-bold uppercase text-gray-400">Academic Year</Label>
                                            <Select
                                                value={formData.academic_year_id}
                                                onValueChange={handleYearChange}
                                                required
                                            >
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue placeholder="Select Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {academicYears.length === 0 ? (
                                                        <div className="p-2 text-sm text-red-500 font-medium text-center">
                                                            No Academic Years Found.<br />
                                                            <span className="text-xs text-gray-400">Please create one in Settings.</span>
                                                        </div>
                                                    ) : (
                                                        academicYears.map(y => (
                                                            <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="term" className="text-xs font-bold uppercase text-gray-400">Term</Label>
                                            <Select
                                                value={formData.term_id}
                                                onValueChange={(val) => setFormData({ ...formData, term_id: val })}
                                                required
                                            >
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue placeholder="Select Term" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {terms.length === 0 ? (
                                                        <div className="p-2 text-sm text-amber-500 font-medium text-center">
                                                            No Terms Found for Year.<br />
                                                            <span className="text-xs text-gray-400">Please ensure year has terms.</span>
                                                        </div>
                                                    ) : (
                                                        terms.map(t => (
                                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="category" className="text-xs font-bold uppercase text-gray-400">Fee Category</Label>
                                            <Select
                                                value={formData.fee_category_id}
                                                onValueChange={(val) => setFormData({ ...formData, fee_category_id: val })}
                                                required
                                            >
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="grade" className="text-xs font-bold uppercase text-gray-400">Grade / Class</Label>
                                            <Select
                                                value={formData.grade}
                                                onValueChange={(val) => setFormData({ ...formData, grade: val })}
                                                required
                                            >
                                                <SelectTrigger className="rounded-xl border-slate-200">
                                                    <SelectValue placeholder="Select Grade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {classes.map(c => (
                                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="amount" className="text-xs font-bold uppercase text-gray-400">Amount ($)</Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0.00"
                                                required
                                                className="rounded-xl border-slate-200"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="due_date" className="text-xs font-bold uppercase text-gray-400">Due Date</Label>
                                            <Input
                                                id="due_date"
                                                type="date"
                                                value={formData.due_date}
                                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                                className="rounded-xl border-slate-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="mandatory"
                                            checked={formData.is_mandatory}
                                            onChange={e => setFormData({ ...formData, is_mandatory: e.target.checked })}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Label htmlFor="mandatory" className="text-xs font-bold text-slate-500">Mandatory for all students in grade</Label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsDialogOpen(false)}
                                        className="font-bold text-slate-400"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8"
                                    >
                                        {isSubmitting ? "Saving..." : selectedStructure ? "Update" : "Create"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-blue-500" />
                            <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Total Templates</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-black text-slate-800">{structures.length}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Avg Structure Cost</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-black text-slate-800">
                            ${(structures.reduce((sum, s) => sum + Number(s.amount), 0) / (structures.length || 1)).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-purple-500" />
                            <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest">Active Year</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 drop-shadow-sm">
                        <div className="text-2xl font-black text-emerald-500">{academicYears.find(y => y.is_current)?.name || "N/A"}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-700">Fee Matrix</CardTitle>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Filter structures..."
                                className="pl-9 w-[300px] border-slate-200 rounded-xl font-medium"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-60 flex flex-col items-center justify-center text-muted-foreground font-bold gap-2">
                            <Activity className="w-8 h-8 animate-spin text-primary" />
                            Fetching Fee Logic...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/20">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="font-bold text-slate-400 pl-6">Fee Category</TableHead>
                                        <TableHead className="font-bold text-slate-400">Class / Grade</TableHead>
                                        <TableHead className="font-bold text-slate-400">Academic Year</TableHead>
                                        <TableHead className="font-bold text-slate-400 text-right">Base Amount</TableHead>
                                        <TableHead className="font-bold text-slate-400 text-center">Status</TableHead>
                                        <TableHead className="font-bold text-slate-400 text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStructures.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-medium">
                                                No fee structures defined.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStructures.map((struct) => (
                                            <TableRow key={struct.id} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="pl-6 font-bold text-slate-800">
                                                    {struct.fee_categories?.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] uppercase px-2 py-0.5 rounded-full shadow-none">
                                                        {struct.grade}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-medium text-sm">
                                                    {struct.academic_years?.name} - {struct.terms?.name}
                                                </TableCell>
                                                <TableCell className="text-right font-black text-slate-900">
                                                    ${Number(struct.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {struct.is_mandatory ? (
                                                        <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-100">
                                                            MANDATORY
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full text-[10px] font-black border border-slate-100">
                                                            OPTIONAL
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleEdit(struct)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => {
                                                                setStructureToDelete(struct)
                                                                setIsDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            Are you sure you want to delete this fee structure for <span className="font-bold text-slate-900">{structureToDelete?.fee_categories?.name} ({structureToDelete?.grade})</span>?
                            This will fail if students are already assigned to this structure.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold border-slate-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-red-200 border-none"
                        >
                            {isSubmitting ? "Deleting..." : "Delete Structure"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
