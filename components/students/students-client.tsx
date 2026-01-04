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
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <Card className="p-4 rounded-2xl border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col xs:flex-row flex-1 gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-transparent focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full xs:w-[140px] h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-transparent focus:ring-2 focus:ring-primary/20">
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
            <Button onClick={handleAddStudent} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-200">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          )}
        </div>
      </Card>

      <Card className="rounded-2xl border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                <TableHead className="font-bold text-zinc-400 text-[10px] uppercase tracking-widest pl-6">Roll No.</TableHead>
                <TableHead className="font-bold text-zinc-400 text-[10px] uppercase tracking-widest">Name</TableHead>
                <TableHead className="font-bold text-zinc-400 text-[10px] uppercase tracking-widest">Class / Section</TableHead>
                <TableHead className="font-bold text-zinc-400 text-[10px] uppercase tracking-widest">Parent Contact</TableHead>
                <TableHead className="font-bold text-zinc-400 text-[10px] uppercase tracking-widest">Status</TableHead>
                {canModify && <TableHead className="text-right font-bold text-zinc-400 text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>}
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
        </div>
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
