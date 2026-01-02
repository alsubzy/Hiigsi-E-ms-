"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash, Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

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
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 7, label: "Sunday" },
]

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
    const [availableTeachers, setAvailableTeachers] = useState<{ id: string, name: string }[]>([]) // Filtered by subject allocation

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

            // We prefer to force the allocated teacher, but allow override if needed?
            // The request said: "Assign teachers to subjects". This implies a strict link.
            // Let's check allocations.
            const allocs = await getSubjectTeachers(activeYear.id, selectedSectionId)
            if (allocs.success) {
                const relevant = allocs.data.filter(a => a.subject_id === formSubjectId)
                if (relevant.length > 0) {
                    // Found allocated teacher
                    setAvailableTeachers(relevant.map(r => ({ id: r.teacher_id, name: r.teacher?.full_name || "Unknown" })))
                    // Auto-select if one
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Timetable</h2>
                    <p className="text-muted-foreground">Schedule classes for sections.</p>
                </div>

                {/* Only enable Add if section selected */}
                <Button onClick={() => setIsDialogOpen(true)} disabled={!selectedSectionId || !activeYear}>
                    <Plus className="mr-2 h-4 w-4" /> Add Class
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex gap-4 items-end">
                    <div className="grid gap-2 w-[200px]">
                        <Label>Grade Level</Label>
                        <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedSectionId(""); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                {initialClasses.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2 w-[200px]">
                        <Label>Section</Label>
                        <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={!selectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSections.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Timetable Grid View */}
            {selectedSectionId ? (
                loadingTimetable ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-7 gap-4">
                        {DAYS.map(day => {
                            const dayEntries = timetable.filter(t => t.day_of_week === day.value)
                            return (
                                <Card key={day.value} className="min-h-[300px] flex flex-col">
                                    <CardHeader className="p-3 bg-muted/50 border-b">
                                        <CardTitle className="text-center text-sm font-bold uppercase">{day.label}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-2 flex-1 space-y-2">
                                        {dayEntries.length === 0 && <p className="text-xs text-muted-foreground text-center mt-8">No classes</p>}
                                        {dayEntries.map(entry => (
                                            <div key={entry.id} className="bg-card border rounded p-2 text-xs shadow-sm group hover:border-primary transition-colors relative">
                                                <div className="font-bold truncate">{entry.subject?.name}</div>
                                                <div className="text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" /> {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                                                </div>
                                                {entry.teacher && <div className="mt-1 font-medium text-primary/80 truncate">{entry.teacher.full_name.split(' ')[0]}</div>}
                                                {entry.room_number && <div className="mt-1 text-muted-foreground">Rm: {entry.room_number}</div>}

                                                <button
                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                                                >
                                                    <Trash className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )
            ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    Select a Class and Section to view the timetable.
                </div>
            )}

            {/* Add Class Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Schedule Class</DialogTitle>
                        <DialogDescription>Add a class to the weekly schedule.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateEntry} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Day</Label>
                            <Select value={formDay} onValueChange={setFormDay}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Day" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS.map(d => <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Teacher</Label>
                            <Select value={formTeacherId} onValueChange={setFormTeacherId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={availableTeachers.length ? "Select Teacher" : "No teachers allocated"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTeachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {!formTeacherId && formSubjectId && <p className="text-xs text-yellow-600">Tip: Allocate a teacher to this subject/section first.</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Room (Optional)</Label>
                            <Input placeholder="e.g. 101" value={formRoom} onChange={e => setFormRoom(e.target.value)} />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting || !formTeacherId}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Schedule
                            </Button>
                        </DialogFooter>
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
