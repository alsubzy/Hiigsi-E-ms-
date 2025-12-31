"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AttendanceMarker } from "@/components/attendance/attendance-marker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { getStudents } from "@/app/actions/students"
import { getAttendanceByDate, getAttendanceStats } from "@/app/actions/attendance"
import type { Student } from "@/lib/types"

interface AttendanceClientProps {
  userRole: string
}

export function AttendanceClient({ userRole }: AttendanceClientProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [grade, setGrade] = useState("1")
  const [section, setSection] = useState("A")
  const [students, setStudents] = useState<Student[]>([])
  const [existingAttendance, setExistingAttendance] = useState<any[]>([])
  const [view, setView] = useState<"mark" | "summary">("mark")
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [date, grade, section])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const dateString = format(date, "yyyy-MM-dd")

      // Load students for selected grade and section
      const allStudents = await getStudents()
      const filteredStudents = allStudents.filter(
        (s) => s.grade === grade && s.section === section && s.status === "active",
      )
      setStudents(filteredStudents)

      // Load existing attendance for the date
      const attendance = await getAttendanceByDate(dateString)
      setExistingAttendance(attendance)

      // Load stats if in summary view
      if (view === "summary") {
        const monthStart = format(new Date(date.getFullYear(), date.getMonth(), 1), "yyyy-MM-dd")
        const monthEnd = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), "yyyy-MM-dd")
        const statsData = await getAttendanceStats(monthStart, monthEnd)
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error loading attendance data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const canMark = ["admin", "teacher", "staff"].includes(userRole)

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Grade 1</SelectItem>
                    <SelectItem value="2">Grade 2</SelectItem>
                    <SelectItem value="3">Grade 3</SelectItem>
                    <SelectItem value="4">Grade 4</SelectItem>
                    <SelectItem value="5">Grade 5</SelectItem>
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
            </div>

            <div className="flex gap-2">
              <Button variant={view === "mark" ? "default" : "outline"} onClick={() => setView("mark")}>
                Mark Attendance
              </Button>
              <Button variant={view === "summary" ? "default" : "outline"} onClick={() => setView("summary")}>
                View Summary
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
      ) : view === "mark" ? (
        students.length > 0 && canMark ? (
          <AttendanceMarker
            students={students}
            existingAttendance={existingAttendance}
            date={format(date, "yyyy-MM-dd")}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {!canMark
                ? "You don't have permission to mark attendance"
                : `No students found for Grade ${grade} Section ${section}`}
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary - {format(date, "MMMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Overall Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Late</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Excused</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
                  </div>
                </div>
                {stats.total > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Attendance Rate:{" "}
                      <span className="font-semibold text-foreground">
                        {((stats.present / stats.total) * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No attendance records for this month</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
