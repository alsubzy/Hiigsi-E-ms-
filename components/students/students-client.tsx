"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { StudentDialog } from "@/components/students/student-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Student } from "@/lib/types"
import { deleteStudent } from "@/app/actions/students"
import { useRouter } from "next/navigation"

interface StudentsClientProps {
  students: Student[]
  userRole: string
}

export function StudentsClient({ students, userRole }: StudentsClientProps) {
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students)
  const [searchQuery, setSearchQuery] = useState("")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>()
  const router = useRouter()

  useEffect(() => {
    let filtered = students

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by grade
    if (gradeFilter !== "all") {
      filtered = filtered.filter((student) => student.grade === gradeFilter)
    }

    setFilteredStudents(filtered)
  }, [searchQuery, gradeFilter, students])

  const handleAddStudent = () => {
    setSelectedStudent(undefined)
    setDialogOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent(id)
        router.refresh()
      } catch (error) {
        alert("Failed to delete student")
      }
    }
  }

  const canModify = ["admin", "staff"].includes(userRole)

  return (
    <div className="p-6 space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="1">Grade 1</SelectItem>
                <SelectItem value="2">Grade 2</SelectItem>
                <SelectItem value="3">Grade 3</SelectItem>
                <SelectItem value="4">Grade 4</SelectItem>
                <SelectItem value="5">Grade 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canModify && (
            <Button onClick={handleAddStudent}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Parent Contact</TableHead>
              <TableHead>Status</TableHead>
              {canModify && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canModify ? 7 : 6} className="text-center text-muted-foreground py-8">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.roll_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{`${student.first_name} ${student.last_name}`}</p>
                      <p className="text-sm text-muted-foreground">{student.email || "N/A"}</p>
                    </div>
                  </TableCell>
                  <TableCell>Grade {student.grade}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{student.parent_name}</p>
                      <p className="text-xs text-muted-foreground">{student.parent_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                  </TableCell>
                  {canModify && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {canModify && <StudentDialog open={dialogOpen} onOpenChange={setDialogOpen} student={selectedStudent} />}
    </div>
  )
}
