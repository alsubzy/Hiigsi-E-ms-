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
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface StudentsClientProps {
  students: Student[]
  userRole: string
  classes: any[] // Type should be ClassRange
}

export function StudentsClient({ students, userRole, classes }: StudentsClientProps) {
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students)
  const [searchQuery, setSearchQuery] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
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

    // Filter by class
    if (classFilter !== "all") {
      filtered = filtered.filter((student) => student.section?.class?.id === classFilter)
    }

    setFilteredStudents(filtered)
  }, [searchQuery, classFilter, students])

  const handleAddStudent = () => {
    setSelectedStudent(undefined)
    setDialogOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setStudentToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return
    try {
      await deleteStudent(studentToDelete)
      toast.success("Student deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete student")
    } finally {
      setStudentToDelete(null)
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
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
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
              <TableHead>Class</TableHead>
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
                  <TableCell>{student.section?.class?.name || "N/A"}</TableCell>
                  <TableCell>{student.section?.name || "N/A"}</TableCell>
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
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(student.id)}>
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
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Student"
        description="Are you sure you want to delete this student? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
