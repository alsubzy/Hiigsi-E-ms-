"use client"

import { Users, ClipboardCheck, GraduationCap, DollarSign } from "lucide-react"
import { StatsCard } from "@/components/dashboard/widgets/stats-card"
import { RevenueChart } from "@/components/dashboard/widgets/revenue-chart"
import { AttendanceChart } from "@/components/dashboard/widgets/attendance-chart"
import { RecentActivity } from "@/components/dashboard/widgets/recent-activity"

export interface AdminDashboardData {
    stats: {
        students: number
        attendanceRate: number
        avgGrade: string
        revenue: number
        revenueTrend: number
    }
    chartData: {
        revenue: { name: string; revenue: number; expenses: number }[]
        attendance: { present: number; absent: number; late: number }
    }
    recentActivity: any[]
}

interface AdminViewProps {
    data: AdminDashboardData
}

export function AdminView({ data }: AdminViewProps) {
    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Students"
                    value={data.stats.students.toLocaleString()}
                    icon={Users}
                    description="Active students"
                    iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                />
                <StatsCard
                    title="Attendance Today"
                    value={`${data.stats.attendanceRate}%`}
                    icon={ClipboardCheck}
                    trend={{ value: 2.1, label: "vs last month", positive: true }}
                    iconClassName="bg-green-100 text-green-600 dark:bg-green-900/20"
                />
                <StatsCard
                    title="Average Grade"
                    value={data.stats.avgGrade}
                    icon={GraduationCap}
                    description="Current term average"
                    iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/20"
                />
                <StatsCard
                    title="Monthly Revenue"
                    value={`$${data.stats.revenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend={{ value: data.stats.revenueTrend, label: "vs last month", positive: data.stats.revenueTrend >= 0 }}
                    iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/20"
                />
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <RevenueChart data={data.chartData.revenue} />
                </div>
                <div className="lg:col-span-3">
                    <AttendanceChart
                        present={data.chartData.attendance.present}
                        absent={data.chartData.attendance.absent}
                        late={data.chartData.attendance.late}
                    />
                </div>
            </div>

            {/* Activity & Lists */}
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    {/* Placeholder for "Recent Invoices" or "Pending Approvals" if needed, 
                or just RecentActivity wide if we want. 
                For now, let's put RecentActivity here or make it smaller.
                The layout showed "Grades" and "Revenue" cards.
            */}
                    <RecentActivity activities={data.recentActivity} className="h-full" />
                </div>
                <div className="lg:col-span-1">
                    {/* We can add a "Quick Actions" card here or a small calendar */}
                </div>
            </div>
        </div>
    )
}
