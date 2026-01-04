"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Loader2, Plus, Trash, Calendar as CalendarIcon, Clock,
    User, MapPin, Book, GraduationCap, Filter as FilterIcon,
    CalendarDays, TimerIcon
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
    { value: 1, label: "Monday", short: "Mon", color: "from-blue-500/10 to-blue-600/5" },
    { value: 2, label: "Tuesday", short: "Tue", color: "from-purple-500/10 to-purple-600/5" },
    { value: 3, label: "Wednesday", short: "Wed", color: "from-green-500/10 to-green-600/5" },
    { value: 4, label: "Thursday", short: "Thu", color: "from-amber-500/10 to-amber-600/5" },
    { value: 5, label: "Friday", short: "Fri", color: "from-orange-500/10 to-orange-600/5" },
    { value: 6, label: "Saturday", short: "Sat", color: "from-pink-500/10 to-pink-600/5" },
    { value: 7, label: "Sunday", short: "Sun", color: "from-red-500/10 to-red-600/5" },
]

// Helper to get subject color
const getSubjectColor = (subjectName: string) => {
    const name = subjectName.toLowerCase()
    if (name.includes("math")) return "border-l-blue-500 bg-blue-500/5"
    if (name.includes("science") || name.includes("bio") || name.includes("chem")) return "border-l-green-500 bg-green-500/5"
    if (name.includes("eng") || name.includes("lang")) return "border-l-purple-500 bg-purple-500/5"
    if (name.includes("hist") || name.includes("geog")) return "border-l-amber-500 bg-amber-500/5"
    if (name.includes("tech") || name.includes("comp")) return "border-l-cyan-500 bg-cyan-500/5"
    return "border-l-zinc-500 bg-zinc-500/5"
}

// Helper to get time-based gradient
const getTimeGradient = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    if (hour < 12) return "from-blue-500/10 to-transparent" // Morning
    if (hour < 16) return "from-amber-500/10 to-transparent" // Afternoon
    return "from-purple-500/10 to-transparent" // Evening
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
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <CalendarDays size={32} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-400 dark:from-white dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
                            Timetable
                        </h2>
                        <p className="text-zinc-500 font-medium">Schedule classes for sections.</p>
                    </div>
                </div>

                <Button
                    onClick={() => setIsDialogOpen(true)}
                    disabled={!selectedSectionId || !activeYear}
                    className="h-11 px-6 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-[1.02] transition-transform active:scale-95 font-bold shadow-xl shadow-zinc-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Class
                </Button>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-xl shadow-zinc-200/40 dark:shadow-none overflow-hidden border-2">
                    <CardContent className="p-8 flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex items-center gap-3 text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                            <FilterIcon size={16} />
                            <span>Filters</span>
                        </div>
                        <div className="grid gap-4 flex-1 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Class Level</Label>
                                <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedSectionId(""); }}>
                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold shadow-sm">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                                        {initialClasses.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="rounded-xl my-1">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Section</Label>
                                <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                        {DAYS.map((day, dayIndex) => {
                            const dayEntries = timetable.filter(t => t.day_of_week === day.value)
                            return (
                                <motion.div
                                    key={day.value}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: dayIndex * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="group"
                                >
                                    <Card className="min-h-[400px] flex flex-col rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl overflow-hidden transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:shadow-none hover:border-zinc-900 dark:hover:border-white">
                                        <CardHeader className={cn(
                                            "p-6 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-br",
                                            day.color
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                                                        {day.label}
                                                    </CardTitle>
                                                    <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                                                        {dayEntries.length} {dayEntries.length === 1 ? 'Class' : 'Classes'}
                                                    </p>
                                                </div>
                                                <CalendarIcon size={20} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 flex-1 space-y-3">
                                            <AnimatePresence>
                                                {dayEntries.length === 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex flex-col items-center justify-center py-12 text-center"
                                                    >
                                                        <Book size={32} className="text-zinc-200 dark:text-zinc-800 mb-3" />
                                                        <p className="text-xs text-zinc-400 font-medium">No classes scheduled</p>
                                                    </motion.div>
                                                )}
                                                {dayEntries.map((entry, entryIndex) => (
                                                    <motion.div
                                                        key={entry.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ delay: entryIndex * 0.05 }}
                                                        whileHover={{ y: -4, scale: 1.02 }}
                                                        className={cn(
                                                            "relative bg-white dark:bg-zinc-900 border-l-4 rounded-xl p-4 shadow-sm group/entry hover:shadow-lg transition-all",
                                                            getSubjectColor(entry.subject?.name || "")
                                                        )}
                                                    >
                                                        <div className="space-y-2.5">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Book size={14} className="text-zinc-400 flex-shrink-0" />
                                                                    <div className="font-black text-sm tracking-tight text-zinc-900 dark:text-white line-clamp-1">
                                                                        {entry.subject?.name}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                                    className="opacity-0 group-hover/entry:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 rounded-lg transition-all"
                                                                >
                                                                    <Trash className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                                                <span className="font-mono">{entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}</span>
                                                            </div>

                                                            {entry.teacher && (
                                                                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                                                    <User className="h-3.5 w-3.5 text-zinc-400" />
                                                                    <span className="truncate">{entry.teacher.full_name}</span>
                                                                </div>
                                                            )}

                                                            {entry.room_number && (
                                                                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                                                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                                                    <span>Room {entry.room_number}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Decorative gradient */}
                                                        <div className={cn(
                                                            "absolute top-0 right-0 w-20 h-20 bg-gradient-to-br rounded-full opacity-0 group-hover/entry:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none",
                                                            getTimeGradient(entry.start_time)
                                                        )} />
                                                    </motion.div>
                                                ))}
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] bg-zinc-50/30 dark:bg-zinc-900/10"
                >
                    <CalendarDays size={64} className="text-zinc-200 dark:text-zinc-800 mb-6" />
                    <p className="font-bold text-zinc-500 text-lg mb-2">No Section Selected</p>
                    <p className="text-sm text-zinc-400">Select a Class and Section to view the timetable.</p>
                </motion.div>
            )}

            {/* Add Class Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl rounded-[2.5rem] bg-white dark:bg-zinc-950 p-0 overflow-hidden border-none shadow-[0_30px_100px_rgba(0,0,0,0.2)]">
                    <DialogHeader className="p-10 pb-4">
                        <DialogTitle className="text-3xl font-black tracking-tighter">Schedule Class</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium text-base">
                            Add a class to the weekly schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateEntry} className="px-10 pb-10 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Day</Label>
                            <Select value={formDay} onValueChange={setFormDay}>
                                <SelectTrigger className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50">
                                    <SelectValue placeholder="Select Day" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[1.5rem] border-zinc-200 dark:border-zinc-800">
                                    {DAYS.map(d => <SelectItem key={d.value} value={d.value.toString()} className="rounded-xl my-1 font-bold">{d.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject</Label>
                            <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                                <SelectTrigger className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50">
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[1.5rem] border-zinc-200 dark:border-zinc-800">
                                    {availableSubjects.map(s => <SelectItem key={s.id} value={s.id} className="rounded-xl my-1 font-bold">{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Teacher</Label>
                            <Select value={formTeacherId} onValueChange={setFormTeacherId}>
                                <SelectTrigger className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50">
                                    <SelectValue placeholder={availableTeachers.length ? "Select Teacher" : "No teachers allocated"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-[1.5rem] border-zinc-200 dark:border-zinc-800">
                                    {availableTeachers.map(t => <SelectItem key={t.id} value={t.id} className="rounded-xl my-1 font-bold">{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {!formTeacherId && formSubjectId && <p className="text-xs text-amber-600 dark:text-amber-500 ml-1 font-medium">Tip: Allocate a teacher to this subject/section first.</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Start Time</Label>
                                <Input
                                    type="time"
                                    value={formStartTime}
                                    onChange={e => setFormStartTime(e.target.value)}
                                    required
                                    className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">End Time</Label>
                                <Input
                                    type="time"
                                    value={formEndTime}
                                    onChange={e => setFormEndTime(e.target.value)}
                                    required
                                    className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 text-base"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Room (Optional)</Label>
                            <Input
                                placeholder="e.g. 101"
                                value={formRoom}
                                onChange={e => setFormRoom(e.target.value)}
                                className="h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900/50 text-base"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !formTeacherId}
                                className="h-14 px-10 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-[0_15px_30px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-5 w-5" />}
                                Schedule
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
