"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Student } from "@/lib/types"
import { saveMark, getMarksByStudent } from "@/app/actions/marks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface GradeEntryFormProps {
  students: Student[]
  subjects: any[]
  term: string
}

export function GradeEntryForm({ students, subjects, term }: GradeEntryFormProps) {
  const router = useRouter()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [markData, setMarkData] = useState<Record<string, { marks: number; remarks: string }>>({})
  const [existingMarks, setExistingMarks] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0])
    }
  }, [students])

  useEffect(() => {
    if (selectedStudent) {
      loadStudentMarks()
    }
  }, [selectedStudent, term])

  const loadStudentMarks = async () => {
    if (!selectedStudent) return

    const marks = await getMarksByStudent(selectedStudent.id)
    const termMarks = marks.filter((g: any) => g.term === term)
    setExistingMarks(termMarks)

    // Initialize mark data
    const initialData: Record<string, { marks: number; remarks: string }> = {}
    subjects.forEach((subject) => {
      const existing = termMarks.find((g: any) => g.subject_id === subject.id)
      initialData[subject.id] = {
        marks: existing ? Number(existing.marks) : 0,
        remarks: existing?.remarks || "",
      }
    })
    setMarkData(initialData)
  }

  const updateMark = (subjectId: string, field: "marks" | "remarks", value: string | number) => {
    setMarkData((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: field === "marks" ? Number(value) : value,
      },
    }))
  }

  const handleSave = async () => {
    if (!selectedStudent) return

    setIsSaving(true)
    try {
      // Save all marks for the selected student
      await Promise.all(
        subjects.map((subject) =>
          saveMark(
            selectedStudent.id,
            subject.id,
            term,
            markData[subject.id]?.marks || 0,
            markData[subject.id]?.remarks || "",
          ),
        ),
      )
      toast.success("Marks saved successfully!")
      router.refresh()

      // Move to next student if available
      const currentIndex = students.findIndex((s) => s.id === selectedStudent.id)
      if (currentIndex < students.length - 1) {
        setSelectedStudent(students[currentIndex + 1])
      }
    } catch (error) {
      toast.error("Failed to save grades: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsSaving(false)
    }
  }

  const calculateLetterGrade = (marks: number) => {
    if (marks >= 90) return "A+"
    if (marks >= 85) return "A"
    if (marks >= 80) return "A-"
    if (marks >= 75) return "B+"
    if (marks >= 70) return "B"
    if (marks >= 65) return "B-"
    if (marks >= 60) return "C+"
    if (marks >= 55) return "C"
    if (marks >= 50) return "D"
    return "F"
  }

  if (!selectedStudent) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">No students available</CardContent>
      </Card>
    )
  }

  const totalMarks = Object.values(markData).reduce((sum, g) => sum + g.marks, 0)
  const avgMarks = subjects.length > 0 ? totalMarks / subjects.length : 0
  const overallResult = calculateLetterGrade(avgMarks)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="text-lg">{`${selectedStudent.first_name} ${selectedStudent.last_name}`}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Roll: {selectedStudent.roll_number} | Class {selectedStudent.class_name} - {selectedStudent.section}
                </p>
              </div>
              <div className="flex gap-2">
                {students.map((student, index) => (
                  <Button
                    key={student.id}
                    variant={student.id === selectedStudent.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStudent(student)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{overallResult}</p>
              <p className="text-sm text-muted-foreground">{avgMarks.toFixed(1)}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map((subject) => {
              const marks = markData[subject.id]?.marks || 0
              const letterResult = calculateLetterGrade(marks)

              return (
                <div key={subject.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">{subject.name}</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={marks}
                          onChange={(e) => updateMark(subject.id, "marks", e.target.value)}
                          className="w-20 text-center"
                          disabled={isSaving}
                        />
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <div className="w-12 text-center">
                        <span className="text-lg font-bold">{letterResult}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Remarks</Label>
                    <Textarea
                      value={markData[subject.id]?.remarks || ""}
                      onChange={(e) => updateMark(subject.id, "remarks", e.target.value)}
                      placeholder="Optional remarks..."
                      className="mt-1"
                      rows={2}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = students.findIndex((s) => s.id === selectedStudent.id)
            if (currentIndex > 0) {
              setSelectedStudent(students[currentIndex - 1])
            }
          }}
          disabled={students.findIndex((s) => s.id === selectedStudent.id) === 0 || isSaving}
        >
          Previous Student
        </Button>
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? "Saving..." : "Save Marks"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = students.findIndex((s) => s.id === selectedStudent.id)
            if (currentIndex < students.length - 1) {
              setSelectedStudent(students[currentIndex + 1])
            }
          }}
          disabled={students.findIndex((s) => s.id === selectedStudent.id) === students.length - 1 || isSaving}
        >
          Next Student
        </Button>
      </div>
    </div>
  )
}
