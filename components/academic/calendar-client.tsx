"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, Plus, MoreVertical, Trash2, Check, Clock, Settings2, ShieldCheck, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { createAcademicYear, setActiveAcademicYear, createTerm, deleteTerm, AcademicYear, Term } from "@/app/actions/academic"

interface CalendarClientProps {
    years: AcademicYear[]
    terms: Term[]
}

export function CalendarClient({ years, terms }: CalendarClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("overview")
    const [isYearDialogOpen, setIsYearDialogOpen] = useState(false)
    const [isTermDialogOpen, setIsTermDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [idToDelete, setIdToDelete] = useState<string | null>(null)

    // Year Form State
    const [yearName, setYearName] = useState("")
    const [yearStartDate, setYearStartDate] = useState<Date>()
    const [yearEndDate, setYearEndDate] = useState<Date>()

    // Term Form State
    const [termName, setTermName] = useState("")
    const [selectedYearId, setSelectedYearId] = useState<string>(years.find(y => y.is_active)?.id || "")
    const [termStartDate, setTermStartDate] = useState<Date>()
    const [termEndDate, setTermEndDate] = useState<Date>()

    const activeYear = years.find((y) => y.is_active)

    async function handleCreateYear(e: React.FormEvent) {
        e.preventDefault()
        if (!yearStartDate || !yearEndDate) {
            toast.error("Please select start and end dates")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createAcademicYear({
                year_name: yearName,
                start_date: yearStartDate.toISOString(),
                end_date: yearEndDate.toISOString(),
            })

            if (result.success) {
                toast.success(result.message)
                setIsYearDialogOpen(false)
                setYearName("")
                setYearStartDate(undefined)
                setYearEndDate(undefined)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to create academic year.")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleSetActiveYear(id: string) {
        try {
            const result = await setActiveAcademicYear(id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to set active year.")
        }
    }

    async function handleCreateTerm(e: React.FormEvent) {
        e.preventDefault()
        if (!termStartDate || !termEndDate || !selectedYearId) {
            toast.error("Please fill all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createTerm({
                academic_year_id: selectedYearId,
                name: termName,
                start_date: termStartDate.toISOString(),
                end_date: termEndDate.toISOString(),
                status: "pending"
            })

            if (result.success) {
                toast.success(result.message)
                setIsTermDialogOpen(false)
                setTermName("")
                setTermStartDate(undefined)
                setTermEndDate(undefined)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to create term.")
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleDeleteTerm(id: string) {
        setIdToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    async function confirmDeleteTerm() {
        if (!idToDelete) return
        const result = await deleteTerm(idToDelete)
        if (result.success) {
            toast.success(result.message)
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIdToDelete(null)
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25" />
                        <div className="relative p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <CalendarIcon size={28} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Academic Calendar
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Global Schedule & Period Management
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsYearDialogOpen(true)}
                        className="h-11 px-5 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-semibold transition-all shadow-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Academic Year
                    </Button>
                    <Button
                        onClick={() => setIsTermDialogOpen(true)}
                        className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-semibold"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Term
                    </Button>
                </div>
            </motion.div>

            {/* Quick Stats / Active Year Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="rounded-[1.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <CalendarIcon size={120} />
                    </div>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                        Current Session
                                    </span>
                                </div>
                                <div className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                                    {activeYear?.year_name || "No Active Session"}
                                </div>
                                <p className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                                    <Clock size={16} />
                                    {activeYear
                                        ? `${format(new Date(activeYear.start_date), "MMMM d, yyyy")} — ${format(new Date(activeYear.end_date), "MMMM d, yyyy")}`
                                        : "Set an active year to begin managing your calendar"}
                                </p>
                            </div>

                            {activeYear && (
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Operational Status</div>
                                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Active & Ready</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <Tabs defaultValue="years" className="space-y-8">
                <TabsList className="bg-zinc-100 dark:bg-zinc-900 h-12 p-1 rounded-xl">
                    <TabsTrigger value="years" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm px-6 font-semibold">
                        Academic Years
                    </TabsTrigger>
                    <TabsTrigger value="terms" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm px-6 font-semibold">
                        Terms Configuration
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="years" className="space-y-6 outline-none">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence mode="popLayout">
                            {years.map((year, idx) => (
                                <motion.div
                                    key={year.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <Card className={cn(
                                        "h-full rounded-2xl border transition-all duration-300 overflow-hidden group",
                                        year.is_active
                                            ? "border-blue-500 shadow-xl shadow-blue-500/5 bg-blue-50/50 dark:bg-blue-900/10"
                                            : "border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                                    )}>
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                                        {year.year_name}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                                        <CalendarIcon size={14} />
                                                        {format(new Date(year.start_date), "MMM yyyy")} - {format(new Date(year.end_date), "MMM yyyy")}
                                                    </div>
                                                </div>
                                                {year.is_active && (
                                                    <div className="px-3 py-1 rounded-full bg-blue-500 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-blue-500/30">
                                                        Active
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                {!year.is_active ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSetActiveYear(year.id)}
                                                        className="h-9 px-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-500 hover:text-white transition-all font-semibold"
                                                    >
                                                        Set Active Year
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                                        <Check size={14} className="stroke-[3]" />
                                                        Currently Enrolled
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </TabsContent>

                <TabsContent value="terms" className="space-y-6 outline-none text-zinc-200">
                    <Card className="rounded-[1.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 p-8 pt-6 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 border border-orange-100 dark:border-orange-500/20">
                                    <Settings2 size={24} />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-extrabold text-zinc-900 dark:text-white">Terms Configuration</CardTitle>
                                    <CardDescription className="font-medium">Define and manage academic periods for active sessions.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                <AnimatePresence mode="popLayout">
                                    {terms.map((term, idx) => {
                                        const year = years.find(y => y.id === term.academic_year_id)
                                        return (
                                            <motion.div
                                                key={term.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-colors">
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">T</span>
                                                        <span className="text-lg font-black leading-none">{idx + 1}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                                {term.name}
                                                            </p>
                                                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                                                                {year?.year_name}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                                                            <Clock size={14} className="opacity-50" />
                                                            {format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTerm(term.id)}
                                                    className="h-10 w-10 rounded-xl text-zinc-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                                {terms.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 text-zinc-300">
                                            <AlertCircle size={32} />
                                        </div>
                                        <h3 className="font-bold text-zinc-900 dark:text-white">No Terms Configured</h3>
                                        <p className="text-sm text-zinc-500 mt-1">Start by adding a new term for the active academic year.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Year Dialog */}
            <Dialog open={isYearDialogOpen} onOpenChange={setIsYearDialogOpen}>
                <DialogContent className="max-w-md rounded-[1.5rem] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
                    <DialogHeader className="p-8 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                        <DialogTitle className="text-2xl font-black tracking-tight">Add Academic Year</DialogTitle>
                        <DialogDescription className="font-medium text-xs">Define a new session for the school calendar.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateYear} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">Year Name</Label>
                            <Input
                                placeholder="e.g. 2024-2025"
                                value={yearName}
                                onChange={(e) => setYearName(e.target.value)}
                                required
                                className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">Start Date</Label>
                                <DatePicker date={yearStartDate} setDate={setYearStartDate} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">End Date</Label>
                                <DatePicker date={yearEndDate} setDate={setYearEndDate} />
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Create Session
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Term Dialog */}
            <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
                <DialogContent className="max-w-md rounded-[1.5rem] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
                    <DialogHeader className="p-8 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                        <DialogTitle className="text-2xl font-black tracking-tight">Create Term</DialogTitle>
                        <DialogDescription className="font-medium text-xs">Add a specific academic period to a session.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTerm} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">Academic Year</Label>
                            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                                <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {years.map((y) => (
                                        <SelectItem key={y.id} value={y.id} className="rounded-lg my-1">{y.year_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">Term Name</Label>
                            <Input
                                placeholder="e.g. Term 1"
                                value={termName}
                                onChange={(e) => setTermName(e.target.value)}
                                required
                                className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">Start Date</Label>
                                <DatePicker date={termStartDate} setDate={setTermStartDate} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 ml-1">End Date</Label>
                                <DatePicker date={termEndDate} setDate={setYearEndDate} />
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Add Term
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDeleteTerm}
                title="Delete Term"
                description="Are you sure you want to delete this term? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    )
}

function DatePicker({ date, setDate }: { date: Date | undefined; setDate: (date: Date | undefined) => void }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full h-12 justify-start text-left font-semibold rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 transition-all",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="rounded-2xl" />
            </PopoverContent>
        </Popover>
    )
}
