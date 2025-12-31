"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, ClipboardCheck, Award, Search } from "lucide-react"
import { AttendanceMarkDialog } from "@/components/teachers/attendance-mark-dialog"
import { cn } from "@/lib/utils"

interface TeachersClientProps {
  initialTeachers: any[]
  initialAttendance: any[]
}

export function TeachersClient({ initialTeachers, initialAttendance }: TeachersClientProps) {
  const [view, setView] = useState<"list" | "attendance">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)

  const filteredTeachers = initialTeachers.filter(
    (teacher) =>
      teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.teacher_profile?.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = [
    {
      title: "Total Teachers",
      value: initialTeachers.length,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Present Today",
      value: initialAttendance.filter((a) => a.status === "present").length,
      icon: ClipboardCheck,
      color: "text-green-500",
    },
    {
      title: "Absent Today",
      value: initialAttendance.filter((a) => a.status === "absent").length,
      icon: ClipboardCheck,
      color: "text-red-500",
    },
    {
      title: "Active Teachers",
      value: initialTeachers.filter((t) => t.teacher_profile?.is_active !== false).length,
      icon: Award,
      color: "text-purple-500",
    },
  ]

  const handleMarkAttendance = (teacher: any) => {
    setSelectedTeacher(teacher)
    setAttendanceDialogOpen(true)
  }

  return (
    <>
      <Header title="Teacher Management" description="Manage teachers, attendance, and evaluations" />
      <div className="p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            Teacher List
          </Button>
          <Button variant={view === "attendance" ? "default" : "outline"} onClick={() => setView("attendance")}>
            Attendance
          </Button>
        </div>

        {view === "list" && (
          <>
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.teacher_profile?.employee_id || "N/A"}</TableCell>
                          <TableCell>{teacher.full_name}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>{teacher.teacher_profile?.department || "-"}</TableCell>
                          <TableCell>{teacher.teacher_profile?.specialization || "-"}</TableCell>
                          <TableCell>{teacher.teacher_profile?.experience_years || 0} years</TableCell>
                          <TableCell>
                            <Badge variant={teacher.teacher_profile?.is_active !== false ? "default" : "secondary"}>
                              {teacher.teacher_profile?.is_active !== false ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No teachers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {view === "attendance" && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance - {new Date().toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialTeachers.length > 0 ? (
                    initialTeachers.map((teacher) => {
                      const attendance = initialAttendance.find((a) => a.teacher_id === teacher.id)
                      return (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.teacher_profile?.employee_id || "N/A"}</TableCell>
                          <TableCell>{teacher.full_name}</TableCell>
                          <TableCell>
                            {attendance ? (
                              <Badge
                                variant={
                                  attendance.status === "present"
                                    ? "default"
                                    : attendance.status === "late"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {attendance.status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not marked</span>
                            )}
                          </TableCell>
                          <TableCell>{attendance?.check_in_time || "-"}</TableCell>
                          <TableCell>{attendance?.check_out_time || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">{attendance?.remarks || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(teacher)}>
                              {attendance ? "Update" : "Mark"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No teachers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <AttendanceMarkDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        teacher={selectedTeacher}
        existingAttendance={initialAttendance.find((a) => a.teacher_id === selectedTeacher?.id)}
      />
    </>
  )
}
