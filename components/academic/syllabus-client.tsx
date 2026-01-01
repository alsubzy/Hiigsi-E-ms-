"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash, FileText, ExternalLink, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

    async function handleDelete(id: string) {
        if (!confirm("Delete this syllabus?")) return
        const result = await deleteSyllabusEntry(id)
        if (result.success) {
            toast.success(result.message)
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Syllabus</h2>
                    <p className="text-muted-foreground">Manage course syllabus and materials.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} disabled={!activeYear}>
                    <Plus className="mr-2 h-4 w-4" /> Upload Syllabus
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Label>Filter by Grade:</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSyllabus.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        No syllabus entries found.
                    </div>
                ) : (
                    filteredSyllabus.map(item => (
                        <Card key={item.id} className="group relative">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                                        <CardDescription>{item.class?.name} • {item.subject?.name}</CardDescription>
                                    </div>
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {item.description && <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>}

                                <div className="flex gap-2 pt-2">
                                    {item.file_url && (
                                        <Button variant="outline" size="sm" className="w-full" asChild>
                                            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-3 w-3" /> View Material
                                            </a>
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Syllabus</DialogTitle>
                        <DialogDescription>Upload syllabus details or link to external materials.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input placeholder="e.g. Mathematics Term 1" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Grade Level</Label>
                                <Select value={formClassId} onValueChange={setFormClassId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select value={formSubjectId} onValueChange={setFormSubjectId} disabled={!formClassId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea placeholder="Topics covered..." value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Material URL</Label>
                            <Input placeholder="https://..." value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
                            <p className="text-xs text-muted-foreground">Link to PDF, Google Doc, or external resource.</p>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
