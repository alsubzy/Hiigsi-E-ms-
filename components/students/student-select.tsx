"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getClasses, getSections, ClassRange, Section } from "@/app/actions/classes"
import { getStudentsBySection } from "@/app/actions/students"
import { Student } from "@/lib/types"
import { Label } from "@/components/ui/label"

interface StudentSelectProps {
    onSelect: (studentId: string | null) => void
    selectedId?: string
    className?: string
}

export function StudentSelect({ onSelect, selectedId, className }: StudentSelectProps) {
    const [classes, setClasses] = useState<ClassRange[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [students, setStudents] = useState<Student[]>([])

    const [selectedClassId, setSelectedClassId] = useState<string>("")
    const [selectedSectionId, setSelectedSectionId] = useState<string>("")
    const [selectedStudentId, setSelectedStudentId] = useState<string>(selectedId || "")

    const [openClass, setOpenClass] = useState(false)
    const [openSection, setOpenSection] = useState(false)
    const [openStudent, setOpenStudent] = useState(false)

    const [isLoadingClasses, setIsLoadingClasses] = useState(false)
    const [isLoadingSections, setIsLoadingSections] = useState(false)
    const [isLoadingStudents, setIsLoadingStudents] = useState(false)

    // Load Classes on mount
    useEffect(() => {
        async function loadClasses() {
            setIsLoadingClasses(true)
            try {
                const res = await getClasses()
                if (res.success && res.data) {
                    setClasses(res.data)
                }
            } catch (error) {
                console.error("Failed to load classes", error)
            } finally {
                setIsLoadingClasses(false)
            }
        }
        loadClasses()
    }, [])

    // Load Sections when Class changes
    useEffect(() => {
        if (!selectedClassId) {
            setSections([])
            return
        }

        async function loadSections() {
            setIsLoadingSections(true)
            try {
                const res = await getSections(selectedClassId)
                if (res.success && res.data) {
                    setSections(res.data)
                }
            } catch (error) {
                console.error("Failed to load sections", error)
            } finally {
                setIsLoadingSections(false)
            }
        }
        loadSections()
    }, [selectedClassId])

    // Load Students when Section changes
    useEffect(() => {
        if (!selectedSectionId) {
            setStudents([])
            return
        }

        async function loadStudents() {
            setIsLoadingStudents(true)
            try {
                const data = await getStudentsBySection(selectedSectionId)
                setStudents(data)
            } catch (error) {
                console.error("Failed to load students", error)
            } finally {
                setIsLoadingStudents(false)
            }
        }
        loadStudents()
    }, [selectedSectionId])

    // Reset downstream selections when upstream changes
    const handleClassChange = (classId: string) => {
        setSelectedClassId(classId)
        setSelectedSectionId("")
        setSelectedStudentId("")
        onSelect(null)
        setOpenClass(false)
    }

    const handleSectionChange = (sectionId: string) => {
        setSelectedSectionId(sectionId)
        setSelectedStudentId("")
        onSelect(null)
        setOpenSection(false)
    }

    const handleStudentChange = (studentId: string) => {
        setSelectedStudentId(studentId)
        onSelect(studentId)
        setOpenStudent(false)
    }

    return (
        <div className={cn("grid gap-4", className)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class Selector */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Class</Label>
                    <Popover open={openClass} onOpenChange={setOpenClass}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openClass}
                                className="w-full justify-between"
                            >
                                {selectedClassId
                                    ? classes.find((c) => c.id === selectedClassId)?.name
                                    : "Select class..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search class..." />
                                <CommandList>
                                    <CommandEmpty>No class found.</CommandEmpty>
                                    <CommandGroup>
                                        {classes.map((c) => (
                                            <CommandItem
                                                key={c.id}
                                                value={c.name}
                                                onSelect={() => handleClassChange(c.id)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedClassId === c.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {c.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Section Selector */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Section</Label>
                    <Popover open={openSection} onOpenChange={setOpenSection}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openSection}
                                className="w-full justify-between"
                                disabled={!selectedClassId}
                            >
                                {selectedSectionId
                                    ? sections.find((s) => s.id === selectedSectionId)?.name
                                    : "Select section..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search section..." />
                                <CommandList>
                                    <CommandEmpty>No section found.</CommandEmpty>
                                    <CommandGroup>
                                        {sections.map((s) => (
                                            <CommandItem
                                                key={s.id}
                                                value={s.name}
                                                onSelect={() => handleSectionChange(s.id)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedSectionId === s.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {s.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Student Selector */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Student</Label>
                <Popover open={openStudent} onOpenChange={setOpenStudent}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openStudent}
                            className="w-full justify-between"
                            disabled={!selectedSectionId}
                        >
                            {selectedStudentId
                                ? students.find((s) => s.id === selectedStudentId)
                                    ? `${students.find((s) => s.id === selectedStudentId)?.first_name} ${students.find((s) => s.id === selectedStudentId)?.last_name}`
                                    : "Select student..."
                                : "Select student..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput placeholder="Search student..." />
                            <CommandList>
                                <CommandEmpty>
                                    {isLoadingStudents ? "Loading..." : "No students found in this section."}
                                </CommandEmpty>
                                <CommandGroup>
                                    {students.map((student) => (
                                        <CommandItem
                                            key={student.id}
                                            value={`${student.first_name} ${student.last_name}`}
                                            onSelect={() => handleStudentChange(student.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedStudentId === student.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{student.first_name} {student.last_name}</span>
                                                <span className="text-xs text-muted-foreground">Roll: {student.roll_number}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
