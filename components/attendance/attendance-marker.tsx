"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Clock, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Student } from "@/lib/types"
import { markAttendance } from "@/app/actions/attendance"
import { useRouter } from "next/navigation"

interface AttendanceMarkerProps {
  students: Student[]
  existingAttendance: any[]
  date: string
}

type AttendanceStatus = "present" | "absent" | "late" | "excused"

export function AttendanceMarker({ students, existingAttendance, date }: AttendanceMarkerProps) {
  const router = useRouter()
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Initialize attendance data from existing records or default to present
    const initialData: Record<string, AttendanceStatus> = {}
    students.forEach((student) => {
      const existing = existingAttendance.find((a) => a.student_id === student.id)
      initialData[student.id] = existing ? existing.status : "present"
    })
    setAttendanceData(initialData)
  }, [students, existingAttendance])

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save attendance for all students
      await Promise.all(
        students.map((student) => markAttendance(student.id, date, attendanceData[student.id] || "present")),
      )
      alert("Attendance saved successfully!")
      router.refresh()
    } catch (error) {
      alert("Failed to save attendance: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsSaving(false)
    }
  }

  const stats = Object.values(attendanceData).reduce(
    (acc, status) => {
      acc[status]++
      return acc
    },
    { present: 0, absent: 0, late: 0, excused: 0 } as Record<AttendanceStatus, number>,
  )

  const statusButtons = [
    { status: "present" as const, label: "Present", icon: Check, color: "text-green-600", bgColor: "bg-green-100" },
    { status: "absent" as const, label: "Absent", icon: X, color: "text-red-600", bgColor: "bg-red-100" },
    { status: "late" as const, label: "Late", icon: Clock, color: "text-orange-600", bgColor: "bg-orange-100" },
    {
      status: "excused" as const,
      label: "Excused",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {statusButtons.map(({ status, label, icon: Icon, color, bgColor }) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", bgColor)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats[status]}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mark Attendance</CardTitle>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Attendance"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{`${student.first_name} ${student.last_name}`}</p>
                  <p className="text-sm text-muted-foreground">Roll: {student.roll_number}</p>
                </div>

                <div className="flex items-center gap-2">
                  {statusButtons.map(({ status, icon: Icon }) => (
                    <Button
                      key={status}
                      variant={attendanceData[student.id] === status ? "default" : "outline"}
                      size="icon"
                      className={cn(attendanceData[student.id] === status && "shadow-md")}
                      onClick={() => updateStatus(student.id, status)}
                      disabled={isSaving}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
