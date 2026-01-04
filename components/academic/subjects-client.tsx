"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Loader2, Plus, Pencil, Trash, UserPlus, X,
    Calculator, Beaker, Book, Languages, Music,
    Palette, Globe, History, Activity, ShieldCheck,
    Atom, Users, GraduationCap, Laptop, Binary,
    Microscope, Brain, Compass, PencilRuler,
    ChevronRight, MoreHorizontal, LayoutGrid,
    Search, Filter, SlidersHorizontal
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"

import { createSubject, updateSubject, deleteSubject, allocateTeacher, removeAllocation, Subject, SubjectTeacher } from "@/app/actions/subjects"
import { ClassRange } from "@/app/actions/classes"
import { AcademicYear } from "@/app/actions/academic"

interface SubjectsClientProps {
    initialSubjects: Subject[]
    classes: ClassRange[]
    teachers: { id: string; full_name: string }[]
    academicYears: AcademicYear[]
    initialAllocations: SubjectTeacher[]
}

// Subject Icon Mapping Utility
const getSubjectIcon = (name: string, code: string) => {
    const searchStr = `${name} ${code}`.toLowerCase()

    if (searchStr.includes("math")) return Calculator
    if (searchStr.includes("science")) return Beaker
    if (searchStr.includes("bio")) return Microscope
    if (searchStr.includes("chem")) return Atom
    if (searchStr.includes("phys")) return Binary
    if (searchStr.includes("eng") || searchStr.includes("lang") || searchStr.includes("somali") || searchStr.includes("arabic")) return Languages
    if (searchStr.includes("hist")) return History
    if (searchStr.includes("geog")) return Globe
    if (searchStr.includes("art") || searchStr.includes("palette")) return Palette
    if (searchStr.includes("music")) return Music
    if (searchStr.includes("sport") || searchStr.includes("phys") || searchStr.includes("pe")) return Activity
    if (searchStr.includes("islam") || searchStr.includes("religion")) return Book
    if (searchStr.includes("tech") || searchStr.includes("comp") || searchStr.includes("ict")) return Laptop
    if (searchStr.includes("psych")) return Brain
    if (searchStr.includes("dra")) return Palette
    if (searchStr.includes("civ")) return ShieldCheck

    return Book
}

const getSubjectColor = (name: string, code: string) => {
    const searchStr = `${name} ${code}`.toLowerCase()
    if (searchStr.includes("math")) return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    if (searchStr.includes("science") || searchStr.includes("chem") || searchStr.includes("bio")) return "bg-green-500/10 text-green-600 border-green-500/20"
    if (searchStr.includes("eng") || searchStr.includes("lang")) return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    if (searchStr.includes("hist") || searchStr.includes("geog")) return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    if (searchStr.includes("tech") || searchStr.includes("comp")) return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20"
    return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
}

export function SubjectsClient({ initialSubjects, classes, teachers, academicYears }: SubjectsClientProps) {
    const router = useRouter()
    const subjects = initialSubjects

    const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
    const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Subject Form
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [subjectName, setSubjectName] = useState("")
    const [subjectCode, setSubjectCode] = useState("")
    const [subjectClassId, setSubjectClassId] = useState("none")
    const [subjectDescription, setSubjectDescription] = useState("")
    const [subjectCredits, setSubjectCredits] = useState("1")


    // Allocation Form
    const [allocationClassId, setAllocationClassId] = useState<string>("")
    const [allocationSectionId, setAllocationSectionId] = useState<string>("")
    const [allocationSubjectId, setAllocationSubjectId] = useState<string>("")
    const [allocationTeacherId, setAllocationTeacherId] = useState<string>("")

    // Active Year Check
    const activeYear = academicYears.find(y => y.is_active)

    // Derived State
    const selectedClass = classes.find(c => c.id === allocationClassId)
    const availableSections = selectedClass?.sections || []
    const availableSubjectsForAllocation = subjects.filter(s => s.class_id === allocationClassId || !s.class_id)

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Handlers
    const handleOpenSubjectDialog = (subj?: Subject) => {
        if (subj) {
            setEditingSubject(subj)
            setSubjectName(subj.name)
            setSubjectCode(subj.code)
            setSubjectClassId(subj.class_id || "none")
            setSubjectDescription(subj.description || "")
            setSubjectCredits(subj.credits?.toString() || "1")
        } else {
            setEditingSubject(null)
            setSubjectName("")
            setSubjectCode("")
            setSubjectClassId("none")
            setSubjectDescription("")
            setSubjectCredits("1")
        }
        setIsSubjectDialogOpen(true)
    }

    const handleSaveSubject = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const data = {
                name: subjectName,
                code: subjectCode.toUpperCase(),
                class_id: subjectClassId === "none" ? undefined : subjectClassId,
                description: subjectDescription,
                credits: parseInt(subjectCredits) || 1
            }

            let result
            if (editingSubject) {
                result = await updateSubject(editingSubject.id, data)
            } else {
                result = await createSubject(data)
            }

            if (result.success) {
                toast.success(result.message)
                setIsSubjectDialogOpen(false)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to save subject.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmDeleteSubject = async () => {
        if (!subjectToDelete) return
        try {
            const result = await deleteSubject(subjectToDelete)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to delete subject.")
        } finally {
            setSubjectToDelete(null)
        }
    }

    const handleAllocate = async () => {
        if (!activeYear) {
            toast.error("No active academic year found.")
            return
        }
        if (!allocationClassId || !allocationSectionId || !allocationSubjectId || !allocationTeacherId) {
            toast.error("Please select all fields.")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await allocateTeacher({
                subject_id: allocationSubjectId,
                section_id: allocationSectionId,
                teacher_id: allocationTeacherId,
                academic_year_id: activeYear.id
            })

            if (result.success) {
                toast.success(result.message)
                setAllocationSubjectId("")
                setAllocationTeacherId("")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to allocate teacher.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 min-h-screen">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-400 dark:from-white dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                        Academic Subjects
                    </h2>
                    <p className="text-zinc-500 font-medium">Define courses and allocate specialized faculty.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
                        <Input
                            placeholder="Search subjects..."
                            className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm focus:ring-0 focus:border-zinc-900 dark:focus:border-white transition-all rounded-xl shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => handleOpenSubjectDialog()}
                        className="h-11 px-6 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-[1.02] transition-transform active:scale-95 font-bold shadow-xl shadow-zinc-200 dark:shadow-none"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Subject
                    </Button>
                </div>
            </motion.div>

            <Tabs defaultValue="list" className="space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1">
                    <TabsList className="bg-transparent h-auto p-0 gap-10">
                        <TabsTrigger
                            value="list"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white relative px-0 py-4 text-zinc-400 transition-none before:absolute before:bottom-0 before:left-0 before:h-0.5 before:w-full before:scale-x-0 data-[state=active]:before:scale-x-100 before:bg-zinc-900 dark:before:bg-white before:transition-transform before:duration-500 font-black text-xs uppercase tracking-widest"
                        >
                            Curriculum Board
                        </TabsTrigger>
                        <TabsTrigger
                            value="allocations"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white relative px-0 py-4 text-zinc-400 transition-none before:absolute before:bottom-0 before:left-0 before:h-0.5 before:w-full before:scale-x-0 data-[state=active]:before:scale-x-100 before:bg-zinc-900 dark:before:bg-white before:transition-transform before:duration-500 font-black text-xs uppercase tracking-widest"
                        >
                            Faculty Allocation
                        </TabsTrigger>
                    </TabsList>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hidden md:flex items-center gap-2 text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] px-2"
                    >
                        <Filter size={12} />
                        Dynamic Board
                    </motion.div>
                </div>

                <TabsContent value="list" className="mt-0 outline-none">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="list-content"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {filteredSubjects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] bg-zinc-50/30 dark:bg-zinc-900/10">
                                    <LayoutGrid size={64} className="text-zinc-200 dark:text-zinc-800 mb-6" />
                                    <p className="font-bold text-zinc-500 text-lg">Empty Curriculum</p>
                                    <p className="text-sm text-zinc-400">Initialize your first subject to start the board</p>
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredSubjects.map((subject, index) => {
                                        const Icon = getSubjectIcon(subject.name, subject.code)
                                        const colorClass = getSubjectColor(subject.name, subject.code)
                                        return (
                                            <motion.div
                                                key={subject.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                whileHover={{ y: -8, scale: 1.02 }}
                                                className="group relative overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-7 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:shadow-none hover:border-zinc-900 dark:hover:border-white"
                                            >
                                                <div className="flex items-start justify-between mb-8">
                                                    <div className={cn("p-5 rounded-2xl border-2 transition-transform group-hover:rotate-6 duration-500", colorClass)}>
                                                        <Icon size={28} />
                                                    </div>
                                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl bg-white/80 dark:bg-zinc-800/80 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                                            onClick={() => handleOpenSubjectDialog(subject)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl bg-red-50/80 dark:bg-red-950/20 shadow-sm hover:bg-red-50 text-red-500"
                                                            onClick={() => {
                                                                setSubjectToDelete(subject.id)
                                                                setIsDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-5">
                                                    <div>
                                                        <h3 className="text-xl font-black tracking-tight mb-1 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{subject.name}</h3>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-2.5 py-1 rounded-md">{subject.code}</span>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{subject.credits} Credits</span>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-zinc-400 font-medium leading-relaxed min-h-[42px] line-clamp-2">
                                                        {subject.description || "Course syllabus and objectives pending publication."}
                                                    </p>

                                                    <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter text-zinc-600 dark:text-zinc-400">
                                                            <GraduationCap size={16} className="text-zinc-400" />
                                                            {subject.class ? subject.class.name : "Core Subject"}
                                                        </div>
                                                        <motion.div whileHover={{ x: 3 }}>
                                                            <ChevronRight size={16} className="text-zinc-300" />
                                                        </motion.div>
                                                    </div>
                                                </div>

                                                {/* Decorative background element */}
                                                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-br from-zinc-100 to-transparent dark:from-zinc-800/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </TabsContent>

                <TabsContent value="allocations" className="mt-0 outline-none">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="allocations-content"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid gap-8 lg:grid-cols-12"
                        >
                            {/* Allocation Form Card */}
                            <Card className="lg:col-span-4 rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-2xl shadow-zinc-200/40 dark:shadow-none overflow-hidden h-fit sticky top-6 border-2">
                                <CardHeader className="bg-zinc-900 dark:bg-zinc-100 p-8">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-white dark:text-zinc-900">Faculty Mapping</CardTitle>
                                    <CardDescription className="text-white/60 dark:text-zinc-500 font-medium">Coordinate subjects with preferred teachers.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Class Level</Label>
                                            <Select value={allocationClassId} onValueChange={setAllocationClassId}>
                                                <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold shadow-sm">
                                                    <SelectValue placeholder="Select Class Level" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                                    {classes.map(c => (
                                                        <SelectItem key={c.id} value={c.id} className="rounded-xl my-1">{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Section</Label>
                                            <Select value={allocationSectionId} onValueChange={setAllocationSectionId} disabled={!allocationClassId}>
                                                <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold shadow-sm">
                                                    <SelectValue placeholder="Select Section" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                                    {availableSections.map(s => (
                                                        <SelectItem key={s.id} value={s.id} className="rounded-xl my-1">{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="py-2">
                                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject</Label>
                                            <Select value={allocationSubjectId} onValueChange={setAllocationSubjectId} disabled={!allocationClassId}>
                                                <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold shadow-sm text-left">
                                                    <SelectValue placeholder="Select Subject" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                                    {availableSubjectsForAllocation.map(s => (
                                                        <SelectItem key={s.id} value={s.id} className="rounded-xl my-1">{s.name} <span className="text-[10px] text-zinc-400 ml-1">({s.code})</span></SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Assigned Faculty</Label>
                                            <Select value={allocationTeacherId} onValueChange={setAllocationTeacherId}>
                                                <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold shadow-sm">
                                                    <SelectValue placeholder="Select Faculty" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                                    {teachers.map(t => (
                                                        <SelectItem key={t.id} value={t.id} className="rounded-xl my-1">{t.full_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleAllocate}
                                        className="w-full h-14 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase tracking-[0.1em] text-xs hover:scale-[1.02] active:scale-95 shadow-2xl transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                                        Execute Allocation
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Recent Allocations Info Card */}
                            <div className="lg:col-span-8 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/10 p-16 text-center flex flex-col items-center justify-center transition-colors hover:bg-zinc-50/60"
                                >
                                    <div className="p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-8 shadow-2xl group transition-transform hover:scale-110">
                                        <Users size={48} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 tracking-tighter">Faculty Network</h3>
                                    <p className="text-zinc-500 font-medium max-w-lg leading-relaxed text-lg">
                                        Bridge the gap between curriculum demands and teaching expertise.
                                        Assignments are synchronized across all modules.
                                    </p>
                                    <div className="flex gap-4 mt-12">
                                        <Button
                                            variant="outline"
                                            className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 font-black uppercase tracking-widest text-[10px] hover:bg-white dark:hover:bg-zinc-900 px-8"
                                            onClick={() => router.push("/dashboard/academic/sections")}
                                        >
                                            Manage Sections
                                        </Button>
                                        <Button
                                            className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 dark:hover:bg-zinc-700 px-8"
                                            onClick={() => router.push("/dashboard/reports")}
                                        >
                                            Distribution Reports
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </TabsContent>
            </Tabs>

            {/* Subject Dialog - Handled by standard Dialog for accessibility, but with premium styling */}
            <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                <DialogContent className="max-w-xl rounded-[2.5rem] bg-white dark:bg-zinc-950 p-0 overflow-hidden border-none shadow-[0_30px_100px_rgba(0,0,0,0.2)]">
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-3xl font-black tracking-tighter">
                            {editingSubject ? "Modify Subject" : "New Academic Root"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium text-base">
                            Inject a new course into the school's dynamic curriculum.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSubject} className="px-10 pb-10 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Course Identity</Label>
                                <Input
                                    placeholder="e.g. Mathematics"
                                    className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-base"
                                    value={subjectName}
                                    onChange={(e) => setSubjectName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Board Code</Label>
                                <Input
                                    placeholder="e.g. MATH101"
                                    className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 uppercase tracking-widest focus:bg-white dark:focus:bg-zinc-900 transition-all text-base"
                                    value={subjectCode}
                                    onChange={(e) => setSubjectCode(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Course Abstract</Label>
                            <Input
                                placeholder="Describe course objectives and scope..."
                                className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-base"
                                value={subjectDescription}
                                onChange={(e) => setSubjectDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Academic Weight (Credits)</Label>
                                <Input
                                    type="number"
                                    className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-base"
                                    value={subjectCredits}
                                    onChange={(e) => setSubjectCredits(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Target Class Level</Label>
                                <Select value={subjectClassId} onValueChange={setSubjectClassId}>
                                    <SelectTrigger className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-base">
                                        <SelectValue placeholder="Core Curriculum" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[1.5rem] border-zinc-200 dark:border-zinc-800">
                                        <SelectItem value="none" className="rounded-xl my-1 font-bold">General Curriculum</SelectItem>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id} className="rounded-xl my-1 font-bold">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsSubjectDialogOpen(false)}
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                Discard
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-14 px-10 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-[0_15px_30px_rgba(0,0,0,0.1)] active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                                {editingSubject ? "Commit Changes" : "Initialize Course"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDeleteSubject}
                title="Deconstruct Subject Root"
                description="This protocol will permanently remove the subject and all associated faculty mappings from the institutional database."
                confirmText="Confirm Deletion"
                variant="destructive"
            />
        </div >
    )
}
