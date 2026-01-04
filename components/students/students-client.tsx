"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, User, Users, Phone, Mail, GraduationCap, MoreVertical, LayoutGrid, List, Filter } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
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
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Student Directory
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Manage and monitor your academic community
          </p>
        </div>

        {canModify && (
          <Button
            onClick={handleAddStudent}
            className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Enroll New Student
          </Button>
        )}
      </motion.div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-2 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <Input
                placeholder="Search by name, email or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-xl border-transparent bg-zinc-50 dark:bg-zinc-900/50 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="h-12 w-full md:w-[200px] rounded-xl border-transparent bg-zinc-50 dark:bg-zinc-900/50 font-semibold">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={18} className="text-zinc-400" />
                    <SelectValue placeholder="All Classes" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="all" className="rounded-lg">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-lg">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-10 w-[1px] bg-zinc-100 dark:bg-zinc-800 hidden md:block" />

              <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg bg-white dark:bg-zinc-800 shadow-sm">
                  <LayoutGrid size={18} className="text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-zinc-400 opacity-50">
                  <List size={18} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredStudents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center"
            >
              <div className="bg-zinc-50 dark:bg-zinc-900 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No students found</h3>
              <p className="text-zinc-500 mt-2">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            filteredStudents.map((student, idx) => (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="group h-full relative overflow-hidden rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                    <User size={120} />
                  </div>

                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                          <span className="text-xl font-black">
                            {student.first_name[0]}{student.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-0.5">
                            #{student.roll_number}
                          </p>
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                            {`${student.first_name} ${student.last_name}`}
                          </h3>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                          student.status === "active"
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {student.status}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                        <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm text-zinc-400">
                          <GraduationCap size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Academic Group</p>
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            {student.section?.class?.name || "N/A"} • {student.section?.name || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                          <Mail size={14} className="opacity-50" />
                          <span className="text-xs font-medium truncate">{student.email || "No email assigned"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                          <Phone size={14} className="opacity-50" />
                          <span className="text-xs font-medium">{student.parent_phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <User size={12} className="text-zinc-400" />
                        </div>
                        <div className="flex flex-col ml-3">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Guardian</span>
                          <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">{student.parent_name}</span>
                        </div>
                      </div>

                      {canModify && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStudent(student)}
                            className="h-9 w-9 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(student.id)}
                            className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

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
