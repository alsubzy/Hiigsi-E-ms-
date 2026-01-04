"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Loader2, Plus, Pencil, Trash, ChevronDown, ChevronRight,
    GraduationCap, Users, School, BookOpen, Layers, Hash,
    UserPlus, Grid3x3
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { createClass, updateClass, deleteClass, createSection, deleteSection, ClassRange } from "@/app/actions/classes"

interface ClassesClientProps {
    initialClasses: ClassRange[]
}

export function ClassesClient({ initialClasses }: ClassesClientProps) {
    const router = useRouter()
    const classes = initialClasses

    const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
    const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deleteType, setDeleteType] = useState<"class" | "section" | null>(null)
    const [idToDelete, setIdToDelete] = useState<string | null>(null)

    // Class Form
    const [editingClass, setEditingClass] = useState<ClassRange | null>(null)
    const [className, setClassName] = useState("")
    const [classLevel, setClassLevel] = useState("")

    // Section Form
    const [sectionName, setSectionName] = useState("")
    const [sectionCapacity, setSectionCapacity] = useState("30")
    const [selectedClassId, setSelectedClassId] = useState("")

    const [expandedClasses, setExpandedClasses] = useState<string[]>([])

    const toggleExpand = (id: string) => {
        setExpandedClasses(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    // Handle Class Operations
    const handleOpenClassDialog = (cls?: ClassRange) => {
        if (cls) {
            setEditingClass(cls)
            setClassName(cls.name)
            setClassLevel(cls.level.toString())
        } else {
            setEditingClass(null)
            setClassName("")
            setClassLevel("")
        }
        setIsClassDialogOpen(true)
    }

    const handleSaveClass = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            let result
            if (editingClass) {
                result = await updateClass(editingClass.id, { name: className, level: parseInt(classLevel) })
            } else {
                result = await createClass({ name: className, level: parseInt(classLevel) })
            }

            if (result.success) {
                toast.success(result.message)
                setIsClassDialogOpen(false)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            console.error("Frontend error saving class:", error)
            toast.error("Failed to connect to the server. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClass = (id: string) => {
        setIdToDelete(id)
        setDeleteType("class")
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!idToDelete || !deleteType) return

        try {
            const result = deleteType === "class"
                ? await deleteClass(idToDelete)
                : await deleteSection(idToDelete)

            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("An error occurred during deletion.")
        } finally {
            setIdToDelete(null)
            setDeleteType(null)
        }
    }

    // Handle Section Operations
    const handleOpenSectionDialog = (classId: string) => {
        setSelectedClassId(classId)
        setSectionName("")
        setSectionCapacity("30")
        setIsSectionDialogOpen(true)
    }

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await createSection({
                class_id: selectedClassId,
                name: sectionName,
                capacity: parseInt(sectionCapacity)
            })

            if (result.success) {
                toast.success(result.message)
                setIsSectionDialogOpen(false)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to create section.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteSection = (id: string) => {
        setIdToDelete(id)
        setDeleteType("section")
        setIsDeleteDialogOpen(true)
    }

    return (
        <div className="space-y-8 min-h-screen">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                        <School size={32} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-400 dark:from-white dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                            Classes & Sections
                        </h2>
                        <p className="text-zinc-500 font-medium">Manage class levels and their course sections.</p>
                    </div>
                </div>

                <Button
                    onClick={() => handleOpenClassDialog()}
                    className="h-11 px-6 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-[1.02] transition-transform active:scale-95 font-bold shadow-xl shadow-zinc-200 dark:shadow-none"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Class Level
                </Button>
            </motion.div>

            {/* Classes Grid */}
            <div className="grid gap-6">
                <AnimatePresence>
                    {classes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
                                <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                                    <School size={64} className="text-zinc-200 dark:text-zinc-800 mb-6" />
                                    <p className="font-bold text-zinc-500 text-lg mb-2">No classes defined yet.</p>
                                    <Button
                                        variant="link"
                                        onClick={() => handleOpenClassDialog()}
                                        className="text-zinc-600 hover:text-zinc-900 dark:hover:text-white font-bold"
                                    >
                                        Create your first Class
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        classes.map((cls, index) => (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="overflow-hidden rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-xl shadow-zinc-200/40 dark:shadow-none transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:shadow-none hover:border-zinc-900 dark:hover:border-white border-2">
                                    <Collapsible open={expandedClasses.includes(cls.id)} onOpenChange={() => toggleExpand(cls.id)}>
                                        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-50/50 to-transparent dark:from-zinc-800/20 dark:to-transparent border-b border-zinc-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-4 flex-1">
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                                                    >
                                                        <motion.div
                                                            animate={{ rotate: expandedClasses.includes(cls.id) ? 0 : -90 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <ChevronDown className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                                                        </motion.div>
                                                    </Button>
                                                </CollapsibleTrigger>

                                                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                                    <GraduationCap size={24} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                                                            {cls.name}
                                                        </h3>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-none px-2.5 py-1"
                                                        >
                                                            Level {cls.level}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                                                        <Users size={14} className="text-zinc-400" />
                                                        <span>{cls.sections?.length || 0} Sections</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenSectionDialog(cls.id)}
                                                    className="h-10 px-4 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-all hover:scale-105"
                                                >
                                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Section
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenClassDialog(cls)}
                                                    className="h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                                >
                                                    <Pencil className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                                    onClick={() => handleDeleteClass(cls.id)}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <CollapsibleContent>
                                            <AnimatePresence>
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="p-6 pt-4"
                                                >
                                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                        {cls.sections?.map((section, sectionIndex) => (
                                                            <motion.div
                                                                key={section.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: sectionIndex * 0.05 }}
                                                                whileHover={{ y: -4, scale: 1.02 }}
                                                                className="group relative flex items-center justify-between p-4 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 hover:border-zinc-900 dark:hover:border-white transition-all hover:shadow-lg"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                                                                        <Layers size={18} className="text-blue-600 dark:text-blue-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-sm tracking-tight text-zinc-900 dark:text-white">
                                                                            Section {section.name}
                                                                        </p>
                                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mt-0.5">
                                                                            <Users size={12} className="text-zinc-400" />
                                                                            <span>Capacity: {section.capacity}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                                                    onClick={() => handleDeleteSection(section.id)}
                                                                >
                                                                    <Trash className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </motion.div>
                                                        ))}
                                                        {(!cls.sections || cls.sections.length === 0) && (
                                                            <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                                                <Grid3x3 size={32} className="text-zinc-200 dark:text-zinc-800 mb-3" />
                                                                <p className="text-sm text-zinc-400 font-medium">No sections created for this class.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Class Dialog */}
            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                <DialogContent className="max-w-xl rounded-[2.5rem] bg-white dark:bg-zinc-950 p-0 overflow-hidden border-none shadow-[0_30px_100px_rgba(0,0,0,0.2)]">
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-3xl font-black tracking-tighter">
                            {editingClass ? "Edit Class" : "New Class"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium text-base">
                            Define a class level (e.g. Class 1, Class 10).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveClass} className="px-10 pb-10 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Class Name</Label>
                            <Input
                                placeholder="e.g. Class 10"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                required
                                className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Level (Numeric)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 10"
                                value={classLevel}
                                onChange={(e) => setClassLevel(e.target.value)}
                                required
                                className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-base"
                            />
                            <p className="text-xs text-zinc-500 ml-1 font-medium">Used for sorting (e.g. 1 for Freshman, 12 for Senior).</p>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsClassDialogOpen(false)}
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-14 px-10 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-[0_15px_30px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <School className="mr-2 h-5 w-5" />}
                                Save
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Section Dialog */}
            <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogContent className="max-w-xl rounded-[2.5rem] bg-white dark:bg-zinc-950 p-0 overflow-hidden border-none shadow-[0_30px_100px_rgba(0,0,0,0.2)]">
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-3xl font-black tracking-tighter">Add Section</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium text-base">
                            Add a section (e.g. A, B, Blue) to Class.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSection} className="px-10 pb-10 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Section Name</Label>
                            <Input
                                placeholder="e.g. A"
                                value={sectionName}
                                onChange={(e) => setSectionName(e.target.value)}
                                required
                                className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Capacity</Label>
                            <Input
                                type="number"
                                value={sectionCapacity}
                                onChange={(e) => setSectionCapacity(e.target.value)}
                                required
                                className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all text-base"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsSectionDialogOpen(false)}
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-14 px-10 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-[0_15px_30px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-5 w-5" />}
                                Create
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                title={deleteType === "class" ? "Delete Class Level" : "Delete Section"}
                description={deleteType === "class"
                    ? "Are you sure you want to delete this class level? All associated sections will also be deleted. This action cannot be undone."
                    : "Are you sure you want to delete this section? This action cannot be undone."}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    )
}
