"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Clock, FileText, UserCheck, Users, Save, CheckCircle2, XCircle, AlertCircle, FilePieChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { Student } from "@/lib/types"
import { markAttendance } from "@/app/actions/attendance"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
      const presentCount = students.filter(s => attendanceData[s.id] === "present").length
      toast.success("Sync Successful", {
        description: `${presentCount} students marked present for ${date}`,
        className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
      })
      router.refresh()
    } catch (error: any) {
      toast.error("Sync Failed", {
        description: error.message || "An error occurred while saving records."
      })
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
    { status: "present" as const, label: "Present", icon: CheckCircle2, color: "emerald", activeColor: "bg-emerald-500 text-white shadow-emerald-500/30" },
    { status: "absent" as const, label: "Absent", icon: XCircle, color: "rose", activeColor: "bg-rose-500 text-white shadow-rose-500/30" },
    { status: "late" as const, label: "Late", icon: Clock, color: "orange", activeColor: "bg-orange-500 text-white shadow-orange-500/30" },
    { status: "excused" as const, label: "Excused", icon: FilePieChart, color: "blue", activeColor: "bg-blue-500 text-white shadow-blue-500/30" },
  ]

  return (
    <div className="space-y-8">
      {/* Real-time Summary Bar */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statusButtons.map(({ status, label, icon: Icon, color }) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: statusButtons.findIndex(b => b.status === status) * 0.05 }}
          >
            <Card className="rounded-3xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                    color === "emerald" && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
                    color === "rose" && "bg-rose-50 dark:bg-rose-900/20 text-rose-600",
                    color === "orange" && "bg-orange-50 dark:bg-orange-900/20 text-orange-600",
                    color === "blue" && "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                  )}>
                    <Icon size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-zinc-900 dark:text-white leading-none mb-1">
                      {stats[status]}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Attendance Controller */}
      <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <CardHeader className="p-8 md:p-10 flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <CardTitle className="text-2xl font-black text-zinc-900 dark:text-white">Session Roster</CardTitle>
            <p className="text-zinc-500 font-medium">Verify presence for {students.length} students</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            {isSaving ? <Clock className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? "Syncing..." : "Commit Attendance"}
          </Button>
        </CardHeader>
        <CardContent className="p-8 md:p-10">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {students.map((student, idx) => (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "group flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-3xl border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                    attendanceData[student.id] === "present" && "border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/5 dark:bg-emerald-900/5",
                    attendanceData[student.id] === "absent" && "border-rose-100 dark:border-rose-900/20 bg-rose-50/5 dark:bg-rose-900/5",
                    attendanceData[student.id] !== "present" && attendanceData[student.id] !== "absent" && "border-zinc-100 dark:border-zinc-800"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform",
                      attendanceData[student.id] === "present" ? "bg-emerald-500 shadow-emerald-500/20" :
                        attendanceData[student.id] === "absent" ? "bg-rose-500 shadow-rose-500/20" :
                          attendanceData[student.id] === "late" ? "bg-orange-500 shadow-orange-500/20" :
                            "bg-blue-500 shadow-blue-500/20"
                    )}>
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widestr text-zinc-400 mb-0.5">#{student.roll_number}</p>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {`${student.first_name} ${student.last_name}`}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    {statusButtons.map(({ status, icon: Icon, label, activeColor }) => (
                      <Button
                        key={status}
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-10 w-10 rounded-xl transition-all duration-300",
                          attendanceData[student.id] === status
                            ? cn("shadow-lg scale-110", activeColor)
                            : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800"
                        )}
                        onClick={() => updateStatus(student.id, status)}
                        disabled={isSaving}
                        title={label}
                      >
                        <Icon size={18} />
                      </Button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
