"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Loader2, Plus, Trash2, Calendar as CalendarIcon, Clock,
    User, MapPin, BookOpen, GraduationCap, Filter as FilterIcon,
    CalendarDays, TimerIcon, LayoutGrid, MoreVertical,
    CheckCircle2, AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { createTimetableEntry, deleteTimetableEntry, getTimetable, TimetableEntry } from "@/app/actions/timetable"
import { ClassRange } from "@/app/actions/classes"
import { Subject, getSubjects, getSubjectTeachers } from "@/app/actions/subjects"
import { AcademicYear } from "@/app/actions/academic"

interface TimetableClientProps {
    initialClasses: ClassRange[]
    academicYears: AcademicYear[]
}

const DAYS = [
    { value: 1, label: "Monday", short: "Mon", color: "from-blue-500/5 to-blue-600/5", iconColor: "text-blue-600" },
    { value: 2, label: "Tuesday", short: "Tue", color: "from-purple-500/5 to-purple-600/5", iconColor: "text-purple-600" },
    { value: 3, label: "Wednesday", short: "Wed", color: "from-emerald-500/5 to-emerald-600/5", iconColor: "text-emerald-600" },
    { value: 4, label: "Thursday", short: "Thu", color: "from-amber-500/5 to-amber-600/5", iconColor: "text-amber-600" },
    { value: 5, label: "Friday", short: "Fri", color: "from-rose-500/5 to-rose-600/5", iconColor: "text-rose-600" },
    { value: 6, label: "Saturday", short: "Sat", color: "from-indigo-500/5 to-indigo-600/5", iconColor: "text-indigo-600" },
    { value: 7, label: "Sunday", short: "Sun", color: "from-slate-500/5 to-slate-600/5", iconColor: "text-slate-600" },
]

// Helper to get subject color patterns
const getSubjectStyle = (subjectName: string) => {
    const name = subjectName.toLowerCase()
    if (name.includes("math")) return { border: "border-l-blue-500", bg: "bg-blue-50/50 dark:bg-blue-900/10", text: "text-blue-700 dark:text-blue-300", icon: "text-blue-500" }
    if (name.includes("science") || name.includes("bio") || name.includes("chem") || name.includes("phys")) return { border: "border-l-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-900/10", text: "text-emerald-700 dark:text-emerald-300", icon: "text-emerald-500" }
    if (name.includes("eng") || name.includes("lang") || name.includes("somali") || name.includes("arabic")) return { border: "border-l-purple-500", bg: "bg-purple-50/50 dark:bg-purple-900/10", text: "text-purple-700 dark:text-purple-300", icon: "text-purple-500" }
    if (name.includes("hist") || name.includes("geog") || name.includes("social")) return { border: "border-l-amber-500", bg: "bg-amber-50/50 dark:bg-amber-900/10", text: "text-amber-700 dark:text-amber-300", icon: "text-amber-500" }
    if (name.includes("tech") || name.includes("comp") || name.includes("ict")) return { border: "border-l-cyan-500", bg: "bg-cyan-50/50 dark:bg-cyan-900/10", text: "text-cyan-700 dark:text-cyan-300", icon: "text-cyan-500" }
    if (name.includes("islam") || name.includes("deen") || name.includes("cre")) return { border: "border-l-rose-500", bg: "bg-rose-50/50 dark:bg-rose-900/10", text: "text-rose-700 dark:text-rose-300", icon: "text-rose-500" }
    return { border: "border-l-zinc-500", bg: "bg-zinc-50/50 dark:bg-zinc-800/20", text: "text-zinc-700 dark:text-zinc-300", icon: "text-zinc-500" }
}

// Helper to get time-based status
const getTimeStatus = (startTime: string, endTime: string) => {
    const now = new Date()
    const currentTime = format(now, "HH:mm")
    if (currentTime >= startTime && currentTime <= endTime) return "current"
    if (currentTime < startTime) return "upcoming"
    return "completed"
}

export function TimetableClient({ initialClasses, academicYears }: TimetableClientProps) {
    const router = useRouter()
    const [timetable, setTimetable] = useState<TimetableEntry[]>([])
    const [loadingTimetable, setLoadingTimetable] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [idToDelete, setIdToDelete] = useState<string | null>(null)

    // Filters
    const [selectedClassId, setSelectedClassId] = useState("")
    const [selectedSectionId, setSelectedSectionId] = useState("")

    // Available Data for Forms
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
    const [availableTeachers, setAvailableTeachers] = useState<{ id: string, name: string }[]>([])

    // Form State
    const [formDay, setFormDay] = useState("1")
    const [formSubjectId, setFormSubjectId] = useState("")
    const [formTeacherId, setFormTeacherId] = useState("")
    const [formStartTime, setFormStartTime] = useState("08:00")
    const [formEndTime, setFormEndTime] = useState("09:00")
    const [formRoom, setFormRoom] = useState("")

    const activeYear = academicYears.find(y => y.is_active)
    const selectedClass = initialClasses.find(c => c.id === selectedClassId)
    const availableSections = selectedClass?.sections || []

    // Fetch Timetable when Section changes
    useEffect(() => {
        if (selectedSectionId) {
            fetchTimetable()
            fetchSubjectsAndAllocations()
        } else {
            setTimetable([])
            setAvailableSubjects([])
        }
    }, [selectedSectionId])

    async function fetchTimetable() {
        setLoadingTimetable(true)
        try {
            const result = await getTimetable({ sectionId: selectedSectionId })
            if (result.success) {
                setTimetable(result.data)
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to load timetable.")
        } finally {
            setLoadingTimetable(false)
        }
    }

    async function fetchSubjectsAndAllocations() {
        if (!selectedClassId || !activeYear) return
        try {
            const subs = await getSubjects(selectedClassId)
            if (subs.success) {
                setAvailableSubjects(subs.data)
            }
        } catch (error: any) {
            console.error("Error fetching subjects/allocations")
        }
    }

    // When subject changes in form, find assigned teacher(s)
    useEffect(() => {
        async function loadTeachers() {
            if (!activeYear || !formSubjectId || !selectedSectionId) return

            const allocs = await getSubjectTeachers(activeYear.id, selectedSectionId)
            if (allocs.success) {
                const relevant = allocs.data.filter(a => a.subject_id === formSubjectId)
                if (relevant.length > 0) {
                    setAvailableTeachers(relevant.map(r => ({ id: r.teacher_id, name: r.teacher?.full_name || "Unknown" })))
                    if (relevant.length === 1) setFormTeacherId(relevant[0].teacher_id)
                } else {
                    setAvailableTeachers([])
                    setFormTeacherId("")
                    toast.warning("No teacher allocated for this subject in this section yet.")
                }
            }
        }
        if (formSubjectId) loadTeachers()
    }, [formSubjectId, selectedSectionId])

    async function handleCreateEntry(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedSectionId) return

        setIsSubmitting(true)
        try {
            const result = await createTimetableEntry({
                section_id: selectedSectionId,
                subject_id: formSubjectId,
                teacher_id: formTeacherId,
                day_of_week: parseInt(formDay),
                start_time: formStartTime,
                end_time: formEndTime,
                room_number: formRoom || undefined
            })

            if (result.success) {
                toast.success(result.message)
                setIsDialogOpen(false)
                fetchTimetable()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to schedule class.")
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleDeleteEntry(id: string) {
        setIdToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    async function confirmDeleteEntry() {
        if (!idToDelete) return
        const result = await deleteTimetableEntry(idToDelete)
        if (result.success) {
            toast.success(result.message)
            fetchTimetable()
        } else {
            toast.error(result.error)
        }
        setIdToDelete(null)
    }

    return (
        <div className="space-y-8 min-h-screen">
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
                            <CalendarDays size={28} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Academic Schedule
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {activeYear?.name || "No Active Year"} • Weekly Planner
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        disabled={!selectedSectionId || !activeYear}
                        className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-semibold disabled:opacity-50"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Class
                    </Button>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="rounded-[1.5rem] border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm border shadow-none">
                    <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/2 space-y-2">
                                <Label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 ml-1">Class Level</Label>
                                <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedSectionId(""); }}>
                                    <SelectTrigger className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="h-4 w-4 text-zinc-400" />
                                            <SelectValue placeholder="Select Class" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {initialClasses.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="rounded-lg my-0.5">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full md:w-1/2 space-y-2">
                                <Label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 ml-1">Section</Label>
                                <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                                    <SelectTrigger className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50">
                                        <div className="flex items-center gap-2">
                                            <FilterIcon className="h-4 w-4 text-zinc-400" />
                                            <SelectValue placeholder="Select Section" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {availableSections.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="rounded-lg my-0.5">{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Timetable Grid View */}
            {selectedSectionId ? (
                loadingTimetable ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 auto-rows-fr">
                        {DAYS.slice(0, 5).map((day, dayIndex) => { // Mostly 5-day week, scroll or wrap for more
                            const dayEntries = timetable
                                .filter(t => t.day_of_week === day.value)
                                .sort((a, b) => a.start_time.localeCompare(b.start_time))

                            return (
                                <motion.div
                                    key={day.value}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: dayIndex * 0.1 }}
                                    className="flex flex-col h-full"
                                >
                                    <div className="mb-4 px-3 flex items-center justify-between">
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{day.label}</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                            {dayEntries.length} Period{dayEntries.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <Card className="flex-1 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/30 shadow-none border overflow-hidden">
                                        <CardContent className="p-3 space-y-3">
                                            <AnimatePresence mode="popLayout">
                                                {dayEntries.length === 0 ? (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex flex-col items-center justify-center py-10 opacity-40 select-none"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-3">
                                                            <CalendarIcon size={20} className="text-zinc-400" />
                                                        </div>
                                                        <p className="text-[11px] font-medium text-zinc-500">No scheduled periods</p>
                                                    </motion.div>
                                                ) : (
                                                    dayEntries.map((entry, entryIndex) => {
                                                        const subjectStyle = getSubjectStyle(entry.subject?.name || "")
                                                        return (
                                                            <motion.div
                                                                key={entry.id}
                                                                layout
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                                                className={cn(
                                                                    "group relative p-4 rounded-xl border bg-white dark:bg-zinc-900 transition-all",
                                                                    "hover:ring-2 hover:ring-blue-500/10 hover:shadow-md",
                                                                    subjectStyle.border
                                                                )}
                                                            >
                                                                <div className="space-y-3">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className={cn("text-[10px] font-black uppercase tracking-wider", subjectStyle.text)}>
                                                                                    {entry.subject?.name}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                                                                                <Clock size={14} className="text-zinc-400" />
                                                                                <span>{entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-2">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleDeleteEntry(entry.id)}
                                                                                className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-zinc-50 dark:border-zinc-800">
                                                                        {entry.teacher && (
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <User size={12} className="text-zinc-400 shrink-0" />
                                                                                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                                                                                    {entry.teacher.full_name}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {entry.room_number && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <MapPin size={12} className="text-zinc-400 shrink-0" />
                                                                                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                                                                    Room {entry.room_number}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )
                                                    })
                                                )}
                                            </AnimatePresence>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </div>
                )
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-40 border rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border flex items-center justify-center mb-6">
                        <CalendarDays size={32} className="text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Schedule Viewer</h3>
                    <p className="text-sm text-zinc-500 mt-1">Select a class and section to manage the weekly schedule.</p>
                </motion.div>
            )}

            {/* Add Class Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
                    <DialogHeader className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                        <DialogTitle className="text-xl font-bold">Schedule Period</DialogTitle>
                        <DialogDescription className="text-xs">
                            Define a new period for this section's weekly schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateEntry} className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Day of Week</Label>
                                <Select value={formDay} onValueChange={setFormDay}>
                                    <SelectTrigger className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium shadow-sm">
                                        <SelectValue placeholder="Select Day" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {DAYS.map(d => <SelectItem key={d.value} value={d.value.toString()} className="rounded-md my-0.5">{d.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Room (Optional)</Label>
                                <Input
                                    placeholder="e.g. 101"
                                    value={formRoom}
                                    onChange={e => setFormRoom(e.target.value)}
                                    className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Subject</Label>
                            <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                                <SelectTrigger className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                                        <SelectValue placeholder="Select Subject" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {availableSubjects.map(s => <SelectItem key={s.id} value={s.id} className="rounded-md my-0.5">{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-baseline justify-between px-1">
                                <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight">Teacher</Label>
                                {!formTeacherId && formSubjectId && <span className="text-[9px] text-amber-600 font-bold uppercase">No allocation found</span>}
                            </div>
                            <Select value={formTeacherId} onValueChange={setFormTeacherId}>
                                <SelectTrigger className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-zinc-400" />
                                        <SelectValue placeholder={availableTeachers.length ? "Select Teacher" : "Select a subject first"} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {availableTeachers.map(t => <SelectItem key={t.id} value={t.id} className="rounded-md my-0.5">{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">Start Time</Label>
                                <div className="relative">
                                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        type="time"
                                        value={formStartTime}
                                        onChange={e => setFormStartTime(e.target.value)}
                                        required
                                        className="h-10 pl-9 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-tight ml-1">End Time</Label>
                                <div className="relative">
                                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <Input
                                        type="time"
                                        value={formEndTime}
                                        onChange={e => setFormEndTime(e.target.value)}
                                        required
                                        className="h-10 pl-9 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
                                disabled={isSubmitting || !formTeacherId}
                                className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Schedule Period"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDeleteEntry}
                title="Remove Schedule Entry"
                description="Are you sure you want to remove this class from the schedule? This action cannot be undone."
                confirmText="Remove"
                variant="destructive"
            />
        </div>
    )
}
