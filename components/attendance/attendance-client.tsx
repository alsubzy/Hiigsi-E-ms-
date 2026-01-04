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
import { getStudents, getStudentsBySection } from "@/app/actions/students"
import { getAttendanceByDate, getAttendanceStats } from "@/app/actions/attendance"
import type { Student } from "@/lib/types"

import { ClassRange } from "@/app/actions/classes"

interface AttendanceClientProps {
  userRole: string
  initialClasses: ClassRange[]
}

export function AttendanceClient({ userRole, initialClasses }: AttendanceClientProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedClassId, setSelectedClassId] = useState(initialClasses[0]?.id || "")
  const [section, setSection] = useState("A")
  const [students, setStudents] = useState<Student[]>([])
  const [existingAttendance, setExistingAttendance] = useState<any[]>([])
  const [view, setView] = useState<"mark" | "summary">("mark")
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const selectedClass = initialClasses.find(c => c.id === selectedClassId)
  const availableSections = selectedClass?.sections || []

  useEffect(() => {
    loadData()
  }, [date, selectedClassId, section])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const dateString = format(date, "yyyy-MM-dd")

      // Load students for selected class and section
      if (selectedClassId && section) {
        const sectionStudents = await getStudentsBySection(section)
        setStudents(sectionStudents)
      } else {
        setStudents([])
      }

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
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <Card className="rounded-2xl border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
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
                <Label>Class</Label>
                <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSection("A"); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={section} onValueChange={setSection} disabled={!selectedClassId}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
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
        <Card className="rounded-2xl border-zinc-100 dark:border-zinc-800 shadow-sm">
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
                : `No students found for Class ${selectedClass?.name} Section ${section}`}
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="rounded-2xl border-zinc-100 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Summary - {format(date, "MMMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Overall Statistics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Records</p>
                    <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Present</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.present}</p>
                  </div>
                  <div className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Absent</p>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.absent}</p>
                  </div>
                  <div className="p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Late</p>
                    <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.late}</p>
                  </div>
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Excused</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.excused}</p>
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
