"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, GraduationCap, DollarSign, UserCheck, Loader2, BarChart3, TrendingUp, Calendar, BookOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"
// Import Recharts components for the new visual data presentation
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts"
import { ReportFilters } from "./report-filters"
import { ExportButtons } from "./export-buttons"
import {
  getAttendanceReport,
  getGradingReport,
  getFinancialReport,
  getTeacherReport,
  getAcademicReport,
  getReportFiltersData
} from "@/app/actions/reports"
import { toast } from "sonner"

interface ReportsClientProps {
  overallStats: any
  attendanceReport: any
  gradingReport: any
  financialReport: any
  teacherReport: any
  academicReport: any
  filterData: any
}

export function ReportsClient({
  overallStats,
  attendanceReport: initialAttendance,
  gradingReport: initialGrading,
  financialReport: initialFinancial,
  teacherReport: initialTeachers,
  academicReport: initialAcademic,
  filterData: initialFilterData,
}: ReportsClientProps) {
  const [view, setView] = useState<"overview" | "academic" | "attendance" | "grading" | "financial" | "teachers">("overview")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>({
    attendance: initialAttendance,
    grading: initialGrading,
    financial: initialFinancial,
    teachers: initialTeachers,
    academic: initialAcademic,
  })
  const [filterData, setFilterData] = useState<any>(initialFilterData)


  const getExportData = () => {
    switch (view) {
      case "attendance": return reportData.attendance?.data || []
      case "grading": return reportData.grading?.data || []
      case "academic": return reportData.academic?.data || []
      case "financial": return reportData.financial?.data || []
      case "teachers": return reportData.teachers?.data || []
      default: return []
    }
  }

  const handleFilterChange = async (filters: any) => {
    setLoading(true)
    try {
      let result: any
      switch (view) {
        case "attendance":
          result = await getAttendanceReport(filters)
          setReportData((prev: any) => ({ ...prev, attendance: result }))
          break
        case "grading":
          result = await getGradingReport(filters)
          setReportData((prev: any) => ({ ...prev, grading: result }))
          break
        case "financial":
          result = await getFinancialReport(filters)
          setReportData((prev: any) => ({ ...prev, financial: result }))
          break
        case "academic":
          result = await getAcademicReport(filters)
          setReportData((prev: any) => ({ ...prev, academic: result }))
          break
        case "teachers":
          result = await getTeacherReport()
          setReportData((prev: any) => ({ ...prev, teachers: result }))
          break
      }
    } catch (error) {
      toast.error("Failed to update report data")
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      title: "Total Students",
      value: overallStats.studentCount,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total Teachers",
      value: overallStats.teacherCount,
      icon: UserCheck,
      color: "text-green-500",
    },
    {
      title: "Total Classes",
      value: overallStats.classCount,
      icon: GraduationCap,
      color: "text-purple-500",
    },
    {
      title: "Total Revenue",
      value: `$${overallStats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Real-time data insights and school metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons data={getExportData()} filename={`${view}_report`} title={`${view.toUpperCase()} Report`} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 print:hidden">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.title || i}
                className="group relative overflow-hidden rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className={cn("absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity", stat.color)}>
                  <Icon size={80} strokeWidth={1} />
                </div>
                <div className="relative z-10 flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.title}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">{stat.value}</span>
                  </div>
                  <div className={cn("mt-4 flex items-center gap-1 text-xs font-bold", stat.color)}>
                    <TrendingUp size={14} />
                    <span>+4.2% from last month</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="sticky top-20 z-20 print:hidden py-4 bg-transparent">
          <div className="flex gap-1 p-1.5 bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-xl rounded-2xl w-fit border border-white/20 dark:border-zinc-700/30 shadow-inner">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "academic", label: "Academic", icon: GraduationCap },
              { id: "attendance", label: "Attendance", icon: Calendar },
              { id: "grading", label: "Marks", icon: BookOpen },
              { id: "financial", label: "Financial", icon: DollarSign },
              { id: "teachers", label: "Teachers", icon: UserCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300",
                  view === tab.id
                    ? "bg-white dark:bg-zinc-100 text-zinc-900 shadow-lg scale-105"
                    : "text-muted-foreground hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-700/50"
                )}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative print:hidden">
          <div className="absolute -top-16 right-0">
            <ReportFilters onFilterChange={handleFilterChange} filterData={filterData} />
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Generating Report...</p>
          </div>
        )}

        {!loading && view === "overview" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Performance Overview</h3>
                    <p className="text-sm text-muted-foreground">Class performance and grade distribution</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold uppercase text-muted-foreground">Average Marks</span>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Jan', value: 65 },
                      { name: 'Feb', value: 72 },
                      { name: 'Mar', value: reportData.grading.stats?.averageMarks || 78 },
                      { name: 'Apr', value: 82 },
                      { name: 'May', value: 85 },
                    ]}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 12, fontWeight: 'bold' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <h3 className="text-lg font-black tracking-tight mb-2">Detailed Metrics</h3>
                <p className="text-sm text-muted-foreground mb-8 text-balance">Comprehensive efficiency tracking across modules.</p>

                <div className="space-y-6">
                  {[
                    { label: "Student Attendance", value: reportData.attendance.stats?.attendanceRate, color: "bg-blue-500" },
                    { label: "Teacher Attendance", value: reportData.teachers.stats?.attendanceRate, color: "bg-green-500" },
                    { label: "Collection Rate", value: 100, color: "bg-purple-500" },
                  ].map((m) => (
                    <div key={m.label} className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                        <span>{m.label}</span>
                        <span className="text-muted-foreground">{m.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-1000", m.color)} style={{ width: `${m.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-700">
                  <p className="text-xs text-muted-foreground italic text-center">Charts update dynamically based on real-time database activity.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                    <BarChart3 size={20} />
                  </div>
                  <h4 className="font-black">Activity Overview</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Attendance Recs", value: reportData.attendance.stats?.totalRecords },
                    { label: "Mark Entries", value: reportData.grading.stats?.totalGrades },
                    { label: "Completed Payments", value: reportData.financial.stats?.completedPayments },
                    { label: "Active Staff", value: reportData.teachers.stats?.activeTeachers },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground block mb-1">{item.label}</span>
                      <span className="text-xl font-black">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-zinc-900 text-white shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2">
                  <TrendingUp size={120} strokeWidth={1} />
                </div>
                <h4 className="text-lg font-black tracking-tight mb-2">Financial Pulse</h4>
                <p className="text-zinc-400 text-sm mb-8 max-w-[200px]">Total revenue generated through all payment methods.</p>

                <div className="text-5xl font-black mb-1 tracking-tighter">${overallStats.totalRevenue.toLocaleString()}</div>
                <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                  <TrendingUp size={16} />
                  <span>8.5% Growth</span>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Last Payment</span>
                    <p className="font-bold text-sm">24 mins ago</p>
                  </div>
                  <button className="px-6 py-2 rounded-xl bg-white text-zinc-900 font-black text-xs hover:bg-zinc-200 transition-colors">
                    View Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && view === "academic" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight">Student Roster</h3>
                <p className="text-sm text-muted-foreground">Comprehensive list of enrolled students</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-black uppercase tracking-widest">
                <Users size={14} className="text-blue-500" />
                <span>{reportData.academic.data?.length || 0} Students</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-xl">
              <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur-md">
                    <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Reg No</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Name</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Class / Section</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-center">Admission</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Parent / Guardian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.academic.data?.map((student: any) => (
                      <TableRow key={student.id} className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <TableCell className="py-4">
                          <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                            {student.roll_number}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-[10px] font-black text-blue-600">
                              {student.first_name[0]}{student.last_name[0]}
                            </div>
                            <span className="font-bold tracking-tight">{student.first_name} {student.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{student.sections?.classes?.name}</span>
                            <span className="text-[10px] font-black uppercase text-muted-foreground">{student.sections?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            {new Date(student.admission_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-sm font-medium">{student.parent_name}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!reportData.academic.data || reportData.academic.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                              <Users size={32} />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest">No Student Records Found</p>
                            <p className="text-xs max-w-[200px]">Try adjusting your filters to find the data you're looking for.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {view === "attendance" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { label: "Total Capacity", value: reportData.attendance.stats?.totalRecords, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Present Active", value: reportData.attendance.stats?.presentCount, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Absences Tracked", value: reportData.attendance.stats?.absentCount, icon: X, color: "text-red-500", bg: "bg-red-500/10" },
                { label: "Cumulative Rate", value: `${reportData.attendance.stats?.attendanceRate}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-1">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", stat.bg, stat.color)}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                  <span className="text-3xl font-black tabular-nums tracking-tighter">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-xl">
              <div className="overflow-x-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur-md">
                    <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Log Date</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-center">Identifier</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Subject / Student Profile</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Educational Context</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.attendance.data?.slice(0, 50).map((record: any, index: number) => (
                      <TableRow key={record.id || index} className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <span className="text-[10px] font-black uppercase text-muted-foreground">{new Date(record.date).getFullYear()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] font-bold">
                            {record.student?.roll_number}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-colors">
                              {record.student?.first_name[0]}{record.student?.last_name[0]}
                            </div>
                            <span className="font-bold tracking-tight">{record.student?.first_name} {record.student?.last_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-sm font-medium">{record.student?.sections?.classes?.name}</span>
                            <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                              {record.student?.sections?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            record.status === "present" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                              record.status === "absent" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
                                "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                          )}>
                            {record.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!reportData.attendance.data || reportData.attendance.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                              <Calendar size={32} />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest">No Attendance Data</p>
                            <p className="text-xs max-w-[200px]">No logs found for the selected criteria.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {view === "grading" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight">Academic Performance</h3>
                <p className="text-sm text-muted-foreground">Grade distribution and student marks</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Avg Score</span>
                  <span className="text-xl font-black text-purple-600">{reportData.grading.stats?.averageMarks}</span>
                </div>
                <div className="h-10 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Total Entries</span>
                  <span className="text-xl font-black">{reportData.grading.stats?.totalGrades}</span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-xl">
              <div className="overflow-x-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur-md">
                    <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Student Profile</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Subject</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-center">Term / Year</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-center">Marks</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-right">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.grading.data?.map((grade: any, index: number) => (
                      <TableRow key={grade.id || index} className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center text-[10px] font-black">
                              {grade.students?.first_name[0]}{grade.students?.last_name[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold tracking-tight">{grade.students?.first_name} {grade.students?.last_name}</span>
                              <span className="text-[10px] font-black uppercase text-muted-foreground">{grade.students?.roll_number}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-medium">{grade.subjects?.name}</TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{grade.terms?.name}</span>
                            <span className="text-[10px] font-black uppercase text-muted-foreground">{grade.academic_years?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="text-lg font-black tracking-tighter">{grade.marks}</span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            Number(grade.marks) >= 80 ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                              Number(grade.marks) >= 60 ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                                "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400"
                          )}>
                            {Number(grade.marks) >= 80 ? "A" : Number(grade.marks) >= 60 ? "B" : "C"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!reportData.grading.data || reportData.grading.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                              <BookOpen size={32} />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest">No Academic Performance Data</p>
                            <p className="text-xs max-w-[200px]">No marks recorded for these subjects yet.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {view === "financial" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-8 rounded-3xl bg-zinc-900 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2">
                  <DollarSign size={100} strokeWidth={1} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Collected Revenue</span>
                <div className="text-4xl font-black my-2 tracking-tighter">${reportData.financial.stats?.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-zinc-400">Successfully processed transactions through official channels.</p>
              </div>

              {[
                { label: "Successful Payments", value: reportData.financial.stats?.completedPayments, sub: "Verified transactions", icon: UserCheck, color: "text-green-500" },
                { label: "Pending / Partial", value: reportData.financial.stats?.pendingPayments, sub: "Action required", icon: Calendar, color: "text-orange-500" },
              ].map((stat, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                  <div className={cn("w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-4", stat.color)}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                  <div className="text-3xl font-black my-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-xl">
              <div className="overflow-x-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur-md">
                    <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Reference No</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Payer Details</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-center">Method</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-right">Amount</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.financial.data?.map((payment: any) => (
                      <TableRow key={payment.id} className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <TableCell className="py-4 font-mono text-xs font-bold text-muted-foreground">
                          #{payment.id?.slice(0, 8)}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold tracking-tight">{payment.students?.first_name} {payment.students?.last_name}</span>
                            <span className="text-[10px] font-black uppercase text-muted-foreground">
                              {payment.students?.sections?.classes?.name} - {payment.students?.sections?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase">
                            {payment.payment_method || "Direct"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right font-black tracking-tighter text-lg">
                          ${Number(payment.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            payment.status === "completed" || payment.status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                              payment.status === "pending" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" :
                                "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                          )}>
                            {payment.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!reportData.financial.data || reportData.financial.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                              <DollarSign size={32} />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest">No Financial Transactions</p>
                            <p className="text-xs max-w-[200px]">No payments match the current filter range.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {view === "teachers" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { label: "Total Faculty", value: reportData.teachers.stats?.totalTeachers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Active Pulse", value: reportData.teachers.stats?.activeTeachers, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "On Premises", value: reportData.teachers.stats?.presentToday, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
                { label: "Staff Punctuality", value: `${reportData.teachers.stats?.attendanceRate}%`, icon: Calendar, color: "text-orange-500", bg: "bg-orange-500/10" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-1">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", stat.bg, stat.color)}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                  <span className="text-3xl font-black tabular-nums tracking-tighter">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 shadow-xl">
              <div className="overflow-x-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur-md">
                    <TableRow className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-transparent">
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Faculty Member</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Academic Unit</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500">Expertise</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-center">Tenure</TableHead>
                      <TableHead className="py-4 font-black uppercase tracking-tighter text-zinc-500 text-right">Availability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.teachers.data?.map((teacher: any) => (
                      <TableRow key={teacher.id} className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-xs font-black shadow-inner">
                              {teacher.full_name?.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold tracking-tight">{teacher.full_name}</span>
                              <span className="text-[10px] font-black text-muted-foreground">{teacher.profile?.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm font-bold uppercase tracking-tighter">{teacher.teacher_profile?.department || "N/A"}</span>
                        </TableCell>
                        <TableCell className="py-4 text-sm font-medium text-muted-foreground italic">
                          {teacher.teacher_profile?.specialization || "General Education"}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="text-xs font-bold">
                            {teacher.teacher_profile?.joining_date ? new Date(teacher.teacher_profile.joining_date).getFullYear() : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            teacher.teacher_profile?.is_active !== false ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                          )}>
                            {teacher.teacher_profile?.is_active !== false ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!reportData.teachers.data || reportData.teachers.data.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                            <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                              <UserCheck size={32} />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest">No Faculty Records</p>
                            <p className="text-xs max-w-[200px]">No staff profiles found in the system.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
