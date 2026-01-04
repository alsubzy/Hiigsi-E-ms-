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
import { Plus, Search, Activity, Edit2, Trash2, AlertCircle, LayoutGrid, DollarSign, Tag, Calendar, GraduationCap, ArrowUpRight, CheckCircle2, Info } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
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
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
        class_id: "",
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

            const currentYear = yearData.find((y: any) => y.is_current || y.is_active) || yearData[0]

            if (currentYear) {
                if (!formData.academic_year_id) {
                    setFormData(prev => ({ ...prev, academic_year_id: currentYear.id }))
                }

                try {
                    const termData = await getTerms(currentYear.id)
                    setTerms(termData)
                    if (!formData.term_id && termData.length > 0) {
                        const currentTerm = termData.find((t: any) => t.is_current || t.is_active) || termData[0]
                        setFormData(prev => ({ ...prev, term_id: currentTerm.id }))
                    }
                } catch (termError) {
                    console.error("Failed to fetch terms", termError)
                }
            }

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
            class_id: "",
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
            class_id: struct.class_id,
            amount: struct.amount.toString(),
            is_mandatory: struct.is_mandatory,
            due_date: struct.due_date ? new Date(struct.due_date).toISOString().split('T')[0] : ""
        })

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
                const currentTerm = termData.find((t: any) => t.is_current || t.is_active) || termData[0]
                setFormData(prev => ({ ...prev, term_id: currentTerm.id }))
            }
        } catch (error: any) {
            toast.error("Failed to load terms: " + error.message)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.academic_year_id || !formData.term_id || !formData.fee_category_id || !formData.class_id || !formData.amount) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)

        const payload = {
            fee_category_id: formData.fee_category_id,
            academic_year_id: formData.academic_year_id,
            term_id: formData.term_id,
            class_id: formData.class_id,
            amount: parseFloat(formData.amount),
            due_date: formData.due_date || undefined,
            is_mandatory: formData.is_mandatory
        }

        try {
            let result;
            if (selectedStructure) {
                result = await updateFeeStructure(selectedStructure.id, payload)
            } else {
                result = await createFeeStructure(payload)
            }

            if (result.success) {
                toast.success(selectedStructure ? "Logic Updated" : "Structure Created", {
                    description: selectedStructure ? "Fee structure rules modified successfully." : "New tuition template registered in ledger."
                })
                setIsDialogOpen(false)
                fetchData()
                resetForm()
            } else {
                toast.error(result.message || "Failed to save fee structure")
            }
        } catch (error: any) {
            console.error("Submission error:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!structureToDelete) return
        setIsSubmitting(true)
        try {
            await deleteFeeStructure(structureToDelete.id)
            toast.success("Protocol Revoked", {
                description: "Fee structure removed from organizational templates."
            })
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
        s.classes?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <LayoutGrid size={20} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Fee Architect</h2>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Define base pricing protocols per grade and academic term.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) resetForm()
                    }}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                                <Plus size={18} /> New Structure
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px] p-0 border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="p-8 bg-zinc-900 text-white">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black tracking-tight">{selectedStructure ? "Modify Protocol" : "New Fee Protocol"}</DialogTitle>
                                        <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                            Define institutional billing template
                                        </DialogDescription>
                                    </DialogHeader>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Academic Year</Label>
                                            <Select value={formData.academic_year_id} onValueChange={handleYearChange} required>
                                                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold">
                                                    <SelectValue placeholder="Select Year" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800">
                                                    {academicYears.map(y => (
                                                        <SelectItem key={y.id} value={y.id} className="font-bold rounded-xl">{y.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Term</Label>
                                            <Select value={formData.term_id} onValueChange={(val) => setFormData({ ...formData, term_id: val })} required>
                                                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold">
                                                    <SelectValue placeholder="Select Term" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800">
                                                    {terms.map(t => (
                                                        <SelectItem key={t.id} value={t.id} className="font-bold rounded-xl">{t.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Fee Category</Label>
                                            <Select value={formData.fee_category_id} onValueChange={(val) => setFormData({ ...formData, fee_category_id: val })} required>
                                                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold">
                                                    <SelectValue placeholder="Category" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800">
                                                    {categories.map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id} className="font-bold rounded-xl">{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Grade / Class</Label>
                                            <Select value={formData.class_id} onValueChange={(val) => setFormData({ ...formData, class_id: val })} required>
                                                <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold">
                                                    <SelectValue placeholder="Grade" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800">
                                                    {classes.map(c => (
                                                        <SelectItem key={c.id} value={c.id} className="font-bold rounded-xl">{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Base Amount ($)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.amount}
                                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                    placeholder="0.00"
                                                    required
                                                    className="h-12 pl-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-black text-lg tracking-tighter"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Due Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                                                <Input
                                                    type="date"
                                                    value={formData.due_date}
                                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                                    className="h-12 pl-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div onClick={() => setFormData({ ...formData, is_mandatory: !formData.is_mandatory })} className={cn(
                                        "p-4 rounded-[1.5rem] border-2 cursor-pointer transition-all flex items-center justify-between",
                                        formData.is_mandatory
                                            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30"
                                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-60"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-xl flex items-center justify-center",
                                                formData.is_mandatory ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                                            )}>
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Mandatory Rule</div>
                                                <div className="text-[9px] font-bold text-zinc-400 italic">Auto-applied to all students in grade</div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-10 h-5 rounded-full relative transition-colors",
                                            formData.is_mandatory ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-800"
                                        )}>
                                            <motion.div
                                                animate={{ x: formData.is_mandatory ? 22 : 2 }}
                                                className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 transition-all">
                                        Discard
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="h-12 px-8 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95">
                                        {isSubmitting ? "Syncing..." : selectedStructure ? "Update Protocol" : "Authorize Protocol"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Protocols", value: structures.length, icon: LayoutGrid, color: "blue" },
                    { label: "Matrix Average", value: `$${(structures.reduce((sum, s) => sum + Number(s.amount), 0) / (structures.length || 1)).toLocaleString()}`, icon: DollarSign, color: "emerald" },
                    { label: "Active Horizon", value: academicYears.find(y => y.is_current)?.name || "N/A", icon: Tag, color: "purple" }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={cn(
                                        "w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:rotate-12",
                                        stat.color === 'blue' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                                            stat.color === 'emerald' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                                                "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                    )}>
                                        <stat.icon size={24} />
                                    </div>
                                    <ArrowUpRight className="text-zinc-300 group-hover:text-zinc-500 transition-colors" size={18} />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{stat.label}</div>
                                    <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{stat.value}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Card */}
            <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Financial Fee Matrix</h3>
                        </div>
                        <div className="relative group w-full lg:max-w-md">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search by grade or category..."
                                className="h-12 pl-12 pr-4 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-80 flex flex-col items-center justify-center gap-4 py-20"
                            >
                                <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Reconstructing Pricing Logic...</span>
                            </motion.div>
                        ) : (
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                <Table className="min-w-[1000px]">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                            <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest pl-10 py-6">Fee Category</TableHead>
                                            <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest py-6">Target Grade</TableHead>
                                            <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest py-6">Chronology</TableHead>
                                            <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest text-right py-6">Base Amount</TableHead>
                                            <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest text-center py-6">Mandatory</TableHead>
                                            <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest text-right pr-10 py-6">Control</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStructures.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-40 text-center py-20 border-none">
                                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                                        <Activity size={48} />
                                                        <p className="font-black text-xs uppercase tracking-widest">No Protocol Entries Found</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredStructures.map((struct, index) => (
                                                <motion.tr
                                                    key={struct.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="border-zinc-50 dark:border-zinc-900 group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                                                >
                                                    <TableCell className="pl-10 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                                <Tag size={14} />
                                                            </div>
                                                            <div className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                                                                {struct.fee_categories?.name}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/20">
                                                            <GraduationCap size={12} className="text-blue-600 dark:text-blue-400" />
                                                            <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase">
                                                                Grade {struct.classes?.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <div className="text-xs font-black text-zinc-800 dark:text-zinc-200">{struct.academic_years?.name}</div>
                                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.1em]">{struct.terms?.name}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-6">
                                                        <div className="flex flex-col items-end">
                                                            <div className="font-black text-xl text-zinc-900 dark:text-white tracking-tighter">
                                                                ${Number(struct.amount).toLocaleString()}
                                                            </div>
                                                            {struct.due_date && (
                                                                <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                                    <Calendar size={10} />
                                                                    Due {format(new Date(struct.due_date), "MMM dd")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {struct.is_mandatory ? (
                                                            <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-[9px] font-black border border-emerald-100 dark:border-emerald-800/30 uppercase tracking-widest">
                                                                <CheckCircle2 size={10} /> REQUIRED
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1 rounded-full text-[9px] font-black border border-zinc-100 dark:border-zinc-800 uppercase tracking-widest">
                                                                OPTIONAL
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-10 py-6">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all active:scale-95"
                                                                onClick={() => handleEdit(struct)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all active:scale-95"
                                                                onClick={() => {
                                                                    setStructureToDelete(struct)
                                                                    setIsDeleteDialogOpen(true)
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </motion.tr>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="max-w-[400px] p-0 border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <div className="p-8 bg-zinc-900 text-white flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 rounded-[2rem] bg-rose-500/20 border-2 border-dashed border-rose-500/50 flex items-center justify-center text-rose-500">
                            <AlertCircle size={32} />
                        </div>
                        <div className="space-y-1">
                            <AlertDialogTitle className="text-2xl font-black tracking-tight">Revoke Protocol?</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                                Irreversible Action Detected
                            </AlertDialogDescription>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-900 dark:text-white border border-zinc-100 dark:border-zinc-800 font-bold text-xs uppercase shadow-sm">
                                    {structureToDelete?.classes?.name}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{structureToDelete?.fee_categories?.name}</div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">${Number(structureToDelete?.amount).toLocaleString()} Base Rate</div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] font-medium text-zinc-500 text-center leading-relaxed px-4">
                            Deleting this protocol will remove it from future billing cycles. Existing student invoices will remain unaffected.
                        </p>
                    </div>
                    <div className="p-8 pt-0 flex flex-col gap-2">
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 transition-all active:scale-95"
                        >
                            {isSubmitting ? "Revoking..." : "Confirm Deletion"}
                        </AlertDialogAction>
                        <AlertDialogCancel className="h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-zinc-400 border-none hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                            Discard Action
                        </AlertDialogCancel>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
