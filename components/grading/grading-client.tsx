"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GradeEntryForm } from "@/components/grading/grade-entry-form"
import { ReportCardView } from "@/components/grading/report-card"
import { getStudents } from "@/app/actions/students"
import { getSubjectsByClass, getReportCard } from "@/app/actions/marks"
import type { Student } from "@/lib/types"

interface GradingClientProps {
  userRole: string
}

const terms = ["Term 1", "Term 2", "Term 3", "Final"]

export function GradingClient({ userRole }: GradingClientProps) {
  const [view, setView] = useState<"entry" | "report">("entry")
  const [className, setClassName] = useState("1")
  const [section, setSection] = useState("A")
  const [term, setTerm] = useState("Term 1")
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [reportCard, setReportCard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [className, section])

  useEffect(() => {
    if (view === "report" && selectedStudentId) {
      loadReportCard()
    }
  }, [view, selectedStudentId, term])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const allStudents = await getStudents()
      const filteredStudents = allStudents.filter(
        (s) => s.class_name === className && s.section === section && s.status === "active",
      )
      setStudents(filteredStudents)

      const subjectsData = await getSubjectsByClass(className)
      setSubjects(subjectsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadReportCard = async () => {
    setIsLoading(true)
    try {
      const report = await getReportCard(selectedStudentId, term)
      setReportCard(report)
    } catch (error) {
      console.error("Error loading report card:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={className} onValueChange={setClassName}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Class 1</SelectItem>
                    <SelectItem value="2">Class 2</SelectItem>
                    <SelectItem value="3">Class 3</SelectItem>
                    <SelectItem value="4">Class 4</SelectItem>
                    <SelectItem value="5">Class 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {view === "report" && (
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {`${student.first_name} ${student.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant={view === "entry" ? "default" : "outline"} onClick={() => setView("entry")}>
                Mark Entry
              </Button>
              <Button variant={view === "report" ? "default" : "outline"} onClick={() => setView("report")}>
                Report Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : view === "entry" ? (
        students.length > 0 && subjects.length > 0 ? (
          <GradeEntryForm students={students} subjects={subjects} term={term} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {students.length === 0
                ? `No students found for Class ${className} Section ${section}`
                : "No subjects configured for this class"}
            </CardContent>
          </Card>
        )
      ) : reportCard ? (
        <ReportCardView reportCard={reportCard} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {selectedStudentId ? "No grades available for this student" : "Please select a student to view report card"}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
