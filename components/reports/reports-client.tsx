"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, GraduationCap, DollarSign, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReportsClientProps {
  overallStats: any
  attendanceReport: any
  gradingReport: any
  financialReport: any
  teacherReport: any
}

export function ReportsClient({
  overallStats,
  attendanceReport,
  gradingReport,
  financialReport,
  teacherReport,
}: ReportsClientProps) {
  const [view, setView] = useState<"overview" | "attendance" | "grading" | "financial" | "teachers">("overview")

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
    <>
      <Header title="Reports & Analytics" description="Comprehensive reports and data insights" />
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

        <div className="flex gap-2 flex-wrap">
          <Button variant={view === "overview" ? "default" : "outline"} onClick={() => setView("overview")}>
            Overview
          </Button>
          <Button variant={view === "attendance" ? "default" : "outline"} onClick={() => setView("attendance")}>
            Attendance
          </Button>
          <Button variant={view === "grading" ? "default" : "outline"} onClick={() => setView("grading")}>
            Grading
          </Button>
          <Button variant={view === "financial" ? "default" : "outline"} onClick={() => setView("financial")}>
            Financial
          </Button>
          <Button variant={view === "teachers" ? "default" : "outline"} onClick={() => setView("teachers")}>
            Teachers
          </Button>
        </div>

        {view === "overview" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Student Attendance Rate</span>
                  <span className="font-semibold">{attendanceReport.stats?.attendanceRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Teacher Attendance Rate</span>
                  <span className="font-semibold">{teacherReport.stats?.attendanceRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Marks</span>
                  <span className="font-semibold">{gradingReport.stats?.averageMarks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Payments</span>
                  <span className="font-semibold">{financialReport.stats?.totalPayments}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Attendance Records</span>
                  <span className="font-semibold">{attendanceReport.stats?.totalRecords}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Grade Entries</span>
                  <span className="font-semibold">{gradingReport.stats?.totalGrades}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed Payments</span>
                  <span className="font-semibold">{financialReport.stats?.completedPayments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Teachers</span>
                  <span className="font-semibold">{teacherReport.stats?.activeTeachers}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === "attendance" && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold">{attendanceReport.stats?.totalRecords}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Present</p>
                      <p className="text-2xl font-bold text-green-600">{attendanceReport.stats?.presentCount}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{attendanceReport.stats?.absentCount}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{attendanceReport.stats?.attendanceRate}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceReport.data?.slice(0, 10).map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.student?.name}</TableCell>
                      <TableCell>
                        {record.student?.grade}
                        {record.student?.section}
                      </TableCell>
                      <TableCell className="capitalize">{record.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {view === "grading" && (
          <Card>
            <CardHeader>
              <CardTitle>Grading Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Grades</p>
                      <p className="text-2xl font-bold">{gradingReport.stats?.totalGrades}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Average Marks</p>
                      <p className="text-2xl font-bold text-blue-600">{gradingReport.stats?.averageMarks}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Grade Distribution</p>
                      <div className="text-sm mt-2">
                        {gradingReport.stats?.gradeDistribution &&
                          Object.entries(gradingReport.stats.gradeDistribution).map(([grade, count]: [string, any]) => (
                            <div key={grade} className="flex justify-between">
                              <span>{grade}:</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "financial" && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${financialReport.stats?.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                      <p className="text-2xl font-bold">{financialReport.stats?.totalPayments}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-blue-600">{financialReport.stats?.completedPayments}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Revenue by Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financialReport.stats?.revenueByMethod &&
                      Object.entries(financialReport.stats.revenueByMethod).map(([method, amount]: [string, any]) => (
                        <div key={method} className="flex justify-between items-center mb-2">
                          <span className="text-sm capitalize">{method.replace("_", " ")}</span>
                          <span className="font-semibold">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Revenue by Fee Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {financialReport.stats?.revenueByFeeType &&
                      Object.entries(financialReport.stats.revenueByFeeType).map(([type, amount]: [string, any]) => (
                        <div key={type} className="flex justify-between items-center mb-2">
                          <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                          <span className="font-semibold">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {view === "teachers" && (
          <Card>
            <CardHeader>
              <CardTitle>Teacher Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Teachers</p>
                      <p className="text-2xl font-bold">{teacherReport.stats?.totalTeachers}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-green-600">{teacherReport.stats?.activeTeachers}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Present Today</p>
                      <p className="text-2xl font-bold text-blue-600">{teacherReport.stats?.presentToday}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-2xl font-bold">{teacherReport.stats?.attendanceRate}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
