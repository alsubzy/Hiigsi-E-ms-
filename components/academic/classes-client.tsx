"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Pencil, Trash, ChevronDown, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { createClass, updateClass, deleteClass, createSection, deleteSection, ClassRange } from "@/app/actions/classes"

interface ClassesClientProps {
    initialClasses: ClassRange[]
}

export function ClassesClient({ initialClasses }: ClassesClientProps) {
    const router = useRouter()
    // Use initialClasses directly to ensure reactivity after router.refresh()
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Classes & Sections</h2>
                    <p className="text-muted-foreground">Manage grade levels and their course sections.</p>
                </div>
                <Button onClick={() => handleOpenClassDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Grade Level
                </Button>
            </div>

            <div className="grid gap-4">
                {classes.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <p>No classes defined yet.</p>
                            <Button variant="link" onClick={() => handleOpenClassDialog()}>Create your first Grade</Button>
                        </CardContent>
                    </Card>
                ) : (
                    classes.map((cls) => (
                        <Card key={cls.id} className="overflow-hidden">
                            <Collapsible open={expandedClasses.includes(cls.id)} onOpenChange={() => toggleExpand(cls.id)}>
                                <div className="flex items-center justify-between p-4 bg-muted/30">
                                    <div className="flex items-center gap-4">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                                                {expandedClasses.includes(cls.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                        </CollapsibleTrigger>
                                        <div>
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                {cls.name}
                                                <Badge variant="outline" className="text-xs font-normal">Level {cls.level}</Badge>
                                            </h3>
                                            <p className="text-sm text-muted-foreground">{cls.sections?.length || 0} Sections</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenSectionDialog(cls.id)}>
                                            <Plus className="h-3 w-3 mr-1" /> Section
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenClassDialog(cls)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClass(cls.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <CollapsibleContent>
                                    <div className="p-4 pt-0 border-t">
                                        <div className="grid gap-2 mt-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                            {cls.sections?.map(section => (
                                                <div key={section.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                                    <div>
                                                        <p className="font-semibold text-sm">Section {section.name}</p>
                                                        <p className="text-xs text-muted-foreground">Capacity: {section.capacity}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSection(section.id)}>
                                                        <Trash className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {(!cls.sections || cls.sections.length === 0) && (
                                                <p className="text-sm text-muted-foreground p-2">No sections created for this class.</p>
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))
                )}
            </div>

            {/* Class Dialog */}
            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingClass ? "Edit Class" : "New Class"}</DialogTitle>
                        <DialogDescription>Define a grade level (e.g. Grade 1, Grade 10).</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveClass} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Class Name</Label>
                            <Input placeholder="e.g. Grade 10" value={className} onChange={(e) => setClassName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Level (Numeric)</Label>
                            <Input type="number" placeholder="e.g. 10" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} required />
                            <p className="text-xs text-muted-foreground">Used for sorting (e.g. 1 for Freshman, 12 for Senior).</p>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Section Dialog */}
            <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Section</DialogTitle>
                        <DialogDescription>Add a section (e.g. A, B, Blue) to Grade.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSection} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Section Name</Label>
                            <Input placeholder="e.g. A" value={sectionName} onChange={(e) => setSectionName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity</Label>
                            <Input type="number" value={sectionCapacity} onChange={(e) => setSectionCapacity(e.target.value)} required />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                title={deleteType === "class" ? "Delete Grade Level" : "Delete Section"}
                description={deleteType === "class"
                    ? "Are you sure you want to delete this grade level? All associated sections will also be deleted. This action cannot be undone."
                    : "Are you sure you want to delete this section? This action cannot be undone."}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    )
}
