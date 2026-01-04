"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2, FileText, ExternalLink, BookOpen, GraduationCap, Search, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { createSyllabusEntry, deleteSyllabusEntry, SyllabusEntry } from "@/app/actions/syllabus"
import { ClassRange } from "@/app/actions/classes"
import { Subject } from "@/app/actions/subjects"
import { AcademicYear } from "@/app/actions/academic"

interface SyllabusClientProps {
    initialSyllabus: SyllabusEntry[]
    classes: ClassRange[]
    subjects: Subject[]
    academicYears: AcademicYear[]
}

export function SyllabusClient({ initialSyllabus, classes, subjects, academicYears }: SyllabusClientProps) {
    const router = useRouter()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [idToDelete, setIdToDelete] = useState<string | null>(null)

    // Filter State
    const [selectedClassId, setSelectedClassId] = useState("all")

    // Form State
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [fileUrl, setFileUrl] = useState("")
    const [formClassId, setFormClassId] = useState("")
    const [formSubjectId, setFormSubjectId] = useState("")

    const activeYear = academicYears.find(y => y.is_active)

    // Filter displayed syllabus
    const filteredSyllabus = selectedClassId === "all"
        ? initialSyllabus
        : initialSyllabus.filter(s => s.class_id === selectedClassId)

    // Available subjects for form
    const availableSubjects = formClassId
        ? subjects.filter(s => s.class_id === formClassId || !s.class_id)
        : []

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!activeYear) {
            toast.error("No active academic year found.")
            return
        }

        setIsSubmitting(true)
        const result = await createSyllabusEntry({
            title,
            description,
            file_url: fileUrl,
            class_id: formClassId,
            subject_id: formSubjectId,
            academic_year_id: activeYear.id
        })
        setIsSubmitting(false)

        if (result.success) {
            toast.success(result.message)
            setIsDialogOpen(false)
            resetForm()
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    function resetForm() {
        setTitle("")
        setDescription("")
        setFileUrl("")
        setFormClassId("")
        setFormSubjectId("")
    }

    function handleDelete(id: string) {
        setIdToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    async function confirmDelete() {
        if (!idToDelete) return
        const result = await deleteSyllabusEntry(idToDelete)
        if (result.success) {
            toast.success(result.message)
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIdToDelete(null)
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25" />
                        <div className="relative p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <BookOpen size={28} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Academic Syllabus
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {activeYear?.year_name || "No Active Year"} • Curriculum Management
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        disabled={!activeYear}
                        className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-semibold disabled:opacity-50"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Upload Syllabus
                    </Button>
                </div>
            </motion.div>

            {/* Filter Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="rounded-[1.25rem] border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm border shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Filter size={16} />
                            <Label className="text-[11px] font-semibold uppercase tracking-wider">Filter by Class</Label>
                        </div>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="w-[200px] h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm focus:ring-2 focus:ring-blue-500/20">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-zinc-400" />
                                    <SelectValue placeholder="All Classes" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="rounded-lg">All Classes</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={c.id} className="rounded-lg my-0.5">{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {filteredSyllabus.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="col-span-full flex flex-col items-center justify-center py-24 border rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border flex items-center justify-center mb-6">
                                <FileText size={32} className="text-zinc-300" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">No Syllabus Found</h3>
                            <p className="text-sm text-zinc-500 mt-1">There are no syllabus materials uploaded for this class.</p>
                        </motion.div>
                    ) : (
                        filteredSyllabus.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                <Card className="group h-full flex flex-col rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all overflow-hidden border-b-4 border-b-transparent hover:border-b-blue-500">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                                        {item.subject?.name}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                        {item.class?.name}
                                                    </span>
                                                </div>
                                                <CardTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                    {item.title}
                                                </CardTitle>
                                            </div>
                                            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col space-y-4">
                                        {item.description && (
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                                                {item.description}
                                            </p>
                                        )}

                                        <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                                            {item.file_url ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="flex-1 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold text-xs"
                                                    asChild
                                                >
                                                    <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Material
                                                    </a>
                                                </Button>
                                            ) : (
                                                <div className="flex-1 text-[11px] font-medium text-zinc-400 italic">No external link attached</div>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md rounded-[1.5rem] p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
                    <DialogHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                        <DialogTitle className="text-xl font-bold">Add Syllabus</DialogTitle>
                        <DialogDescription className="text-xs">
                            Upload curriculum details or link to external materials.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Title</Label>
                            <Input
                                placeholder="e.g. Mathematics Term 1"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Class Level</Label>
                                <Select value={formClassId} onValueChange={setFormClassId} required>
                                    <SelectTrigger className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {classes.map(c => <SelectItem key={c.id} value={c.id} className="rounded-md my-0.5">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Subject</Label>
                                <Select value={formSubjectId} onValueChange={setFormSubjectId} disabled={!formClassId} required>
                                    <SelectTrigger className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm disabled:opacity-50">
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {availableSubjects.map(s => <SelectItem key={s.id} value={s.id} className="rounded-md my-0.5">{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Description</Label>
                            <Textarea
                                placeholder="Core topics and learning objectives covered in this syllabus..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Material URL</Label>
                            <div className="relative">
                                <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    placeholder="https://..."
                                    value={fileUrl}
                                    onChange={(e) => setFileUrl(e.target.value)}
                                    className="h-11 pl-9 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
                                />
                            </div>
                            <p className="text-[10px] text-zinc-400 ml-1 italic font-medium">Link to PDF, Drive, or external resource.</p>
                        </div>

                        <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="h-10 px-4 rounded-lg font-semibold text-zinc-500 hover:bg-zinc-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-10 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Syllabus"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Delete Syllabus"
                description="Are you sure you want to delete this syllabus? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    )
}
