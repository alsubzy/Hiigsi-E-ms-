"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Pencil, Trash, UserPlus, X } from "lucide-react"

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

import { createSubject, updateSubject, deleteSubject, allocateTeacher, removeAllocation, Subject, SubjectTeacher } from "@/app/actions/subjects"
import { ClassRange } from "@/app/actions/classes"
import { AcademicYear } from "@/app/actions/academic"

interface SubjectsClientProps {
    initialSubjects: Subject[]
    classes: ClassRange[]
    teachers: { id: string; full_name: string }[]
    academicYears: AcademicYear[]
    initialAllocations: SubjectTeacher[] // Passed for a specific context if needed, but we might fetch dynamically
}

export function SubjectsClient({ initialSubjects, classes, teachers, academicYears }: SubjectsClientProps) {
    const router = useRouter()
    // Use initialSubjects directly to ensure reactivity after router.refresh()
    const subjects = initialSubjects

    const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
    const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null)

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

    // Filter subjects for the selected class (or general subjects)
    // Logic: In allocation, we only show subjects linked to the selected class
    const availableSubjectsForAllocation = subjects.filter(s => s.class_id === allocationClassId)

    // Handlers - Subject CRUD
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
                code: subjectCode,
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

    const handleDeleteSubject = (id: string) => {
        setSubjectToDelete(id)
        setIsDeleteDialogOpen(true)
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

    // Handle Allocation
    const handleAllocate = async () => {
        if (!activeYear) {
            toast.error("No active academic year found. Please set one in Calendar.")
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Subjects & Teachers</h2>
                    <p className="text-muted-foreground">Manage subjects and assign teachers to sections.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleOpenSubjectDialog()}>
                        <Plus className="mr-2 h-4 w-4" /> New Subject
                    </Button>
                    <Button variant="outline" onClick={() => setIsAllocationDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Assign Teacher
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">All Subjects</TabsTrigger>
                    <TabsTrigger value="allocations">Allocations</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {subjects.map(subject => (
                            <Card key={subject.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-bold">{subject.name}</CardTitle>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenSubjectDialog(subject)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSubject(subject.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs font-mono bg-muted p-1 rounded inline-block mb-2">{subject.code}</div>
                                    <p className="text-sm text-muted-foreground">
                                        {subject.class ? `Class Level: ${subject.class.name}` : "General Subject"}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="allocations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Teacher Allocations</CardTitle>
                            <CardDescription>Assign teachers to subjects for specific sections.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-md bg-muted/20">
                                <div className="grid gap-2 flex-1">
                                    <Label>Class Level</Label>
                                    <Select value={allocationClassId} onValueChange={setAllocationClassId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2 flex-1">
                                    <Label>Section</Label>
                                    <Select value={allocationSectionId} onValueChange={setAllocationSectionId} disabled={!allocationClassId}>
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
                            </div>

                            {/* Allocation Entry Form */}
                            <div className="flex flex-col md:flex-row gap-4 items-end border-t pt-4">
                                <div className="grid gap-2 flex-1">
                                    <Label>Subject</Label>
                                    <Select value={allocationSubjectId} onValueChange={setAllocationSubjectId} disabled={!allocationClassId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSubjectsForAllocation.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2 flex-1">
                                    <Label>Teacher</Label>
                                    <Select value={allocationTeacherId} onValueChange={setAllocationTeacherId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teachers.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAllocate} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Assign
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Subject Dialog */}
            <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSubject ? "Edit Subject" : "New Subject"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveSubject} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Subject Name</Label>
                            <Input placeholder="e.g. Mathematics" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject Code</Label>
                            <Input placeholder="e.g. MATH101" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Input placeholder="Brief overview..." value={subjectDescription} onChange={(e) => setSubjectDescription(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Credits</Label>
                            <Input type="number" value={subjectCredits} onChange={(e) => setSubjectCredits(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Class Level (Optional)</Label>
                            <Select value={subjectClassId} onValueChange={setSubjectClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="General Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">General (All Classes)</SelectItem>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Link this subject to a specific class level.</p>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDeleteSubject}
                title="Delete Subject"
                description="Are you sure you want to delete this subject? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    )
}
