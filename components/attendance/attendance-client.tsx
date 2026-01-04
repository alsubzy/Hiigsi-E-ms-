"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AttendanceMarker } from "@/components/attendance/attendance-marker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, GraduationCap, Users, UserCheck, TrendingUp, Filter, BarChart3, ChevronRight, CheckCircle2, AlertCircle, Clock, FilePieChart } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
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
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <UserCheck className="text-blue-600" size={32} />
            Attendance Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Track and monitor student presence across sessions
          </p>
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Button
            variant="ghost"
            onClick={() => setView("mark")}
            className={cn(
              "h-11 px-6 rounded-xl font-bold transition-all",
              view === "mark" ? "bg-white dark:bg-zinc-800 shadow-md text-blue-600" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            Mark Mode
          </Button>
          <Button
            variant="ghost"
            onClick={() => setView("summary")}
            className={cn(
              "h-11 px-6 rounded-xl font-bold transition-all",
              view === "summary" ? "bg-white dark:bg-zinc-800 shadow-md text-blue-600" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            Insight Summary
          </Button>
        </div>
      </motion.div>

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-2 rounded-3xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-visible">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full p-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Session Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-12 w-full justify-start text-left font-bold rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white transition-all",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="rounded-2xl" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Class</Label>
                <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSection("A"); }}>
                  <SelectTrigger className="h-12 w-full rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 font-bold">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-emerald-500" />
                      <SelectValue placeholder="Select Class" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    {initialClasses.map(c => (
                      <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Section</Label>
                <Select value={section} onValueChange={setSection} disabled={!selectedClassId}>
                  <SelectTrigger className="h-12 w-full rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 font-bold">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-orange-500" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    {availableSections.map(s => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative">
              <div className="h-16 w-16 border-4 border-zinc-100 dark:border-zinc-800 rounded-full" />
              <div className="absolute top-0 h-16 w-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-6 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Retrieving Records...</p>
          </motion.div>
        ) : view === "mark" ? (
          <motion.div
            key="mark-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {students.length > 0 && canMark ? (
              <AttendanceMarker
                students={students}
                existingAttendance={existingAttendance}
                date={format(date, "yyyy-MM-dd")}
              />
            ) : (
              <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-20 text-center">
                <div className="bg-zinc-50 dark:bg-zinc-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Users size={48} className="text-zinc-300" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                  {!canMark ? "Access Restricted" : "No Enrollment Found"}
                </h3>
                <p className="text-zinc-500 mt-2 max-w-sm mx-auto font-medium">
                  {!canMark
                    ? "Your account does not have the necessary privileges to manage attendance logs."
                    : `We couldn't find any students assigned to ${selectedClass?.name || 'this class'} Section ${section}.`}
                </p>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="summary-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="space-y-6"
          >
            <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Monthly Insights</h2>
                    <p className="text-zinc-500 font-medium">Performance report for {format(date, "MMMM yyyy")}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
                    <TrendingUp className="text-blue-600" size={24} />
                  </div>
                </div>

                {stats ? (
                  <div className="space-y-10">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {[
                        { label: "Total Logs", value: stats.total, icon: FilePieChart, color: "zinc" },
                        { label: "Present", value: stats.present, icon: CheckCircle2, color: "emerald" },
                        { label: "Absent", value: stats.absent, icon: AlertCircle, color: "rose" },
                        { label: "Late", value: stats.late, icon: Clock, color: "orange" },
                        { label: "Excused", value: stats.excused, icon: GraduationCap, color: "blue" },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className={cn(
                            "p-5 rounded-3xl border transition-all hover:scale-[1.02]",
                            item.color === "zinc" && "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800",
                            item.color === "emerald" && "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20",
                            item.color === "rose" && "bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20",
                            item.color === "orange" && "bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20",
                            item.color === "blue" && "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm",
                            item.color === "zinc" && "bg-white dark:bg-zinc-800 text-zinc-400",
                            item.color === "emerald" && "bg-white dark:bg-zinc-800 text-emerald-500",
                            item.color === "rose" && "bg-white dark:bg-zinc-800 text-rose-500",
                            item.color === "orange" && "bg-white dark:bg-zinc-800 text-orange-500",
                            item.color === "blue" && "bg-white dark:bg-zinc-800 text-blue-500"
                          )}>
                            <item.icon size={20} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{item.label}</p>
                          <p className={cn(
                            "text-3xl font-black",
                            item.color === "zinc" && "text-zinc-900 dark:text-zinc-100",
                            item.color === "emerald" && "text-emerald-600",
                            item.color === "rose" && "text-rose-600",
                            item.color === "orange" && "text-orange-600",
                            item.color === "blue" && "text-blue-600"
                          )}>{item.value}</p>
                        </motion.div>
                      ))}
                    </div>

                    {stats.total > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] p-8 border border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6"
                      >
                        <div className="flex items-center gap-6">
                          <div className="relative w-20 h-20">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                              <path
                                className="text-zinc-200 dark:text-zinc-800"
                                strokeDasharray="100, 100"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                              />
                              <path
                                className="text-blue-600"
                                strokeDasharray={`${((stats.present / stats.total) * 100).toFixed(1)}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-black text-zinc-900 dark:text-white">
                                {Math.round((stats.present / stats.total) * 100)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-black text-zinc-900 dark:text-white">Session Compliance Rate</p>
                            <p className="text-sm text-zinc-500 font-medium max-w-xs">High attendance indicates strong student engagement and curriculum consistency.</p>
                          </div>
                        </div>
                        <Button className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 group">
                          Export Full Report
                          <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem]">
                    <div className="text-zinc-300 mb-4 flex justify-center">
                      <BarChart3 size={64} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-700 dark:text-zinc-400">No data available for this period</h3>
                    <p className="text-zinc-400 mt-1 max-w-xs mx-auto">Selected month has no recorded attendance logs to generate insights from.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
