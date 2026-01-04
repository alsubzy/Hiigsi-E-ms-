"use client"

import { Users, ClipboardCheck, GraduationCap, DollarSign, TrendingUp, Calendar, Bell, Award, ArrowUpRight, ArrowDownRight, MoreHorizontal, Activity } from "lucide-react"
import { StatsCard } from "@/components/dashboard/widgets/stats-card"
import { RevenueChart } from "@/components/dashboard/widgets/revenue-chart"
import { AttendanceChart } from "@/components/dashboard/widgets/attendance-chart"
import { RecentActivity } from "@/components/dashboard/widgets/recent-activity"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export interface AdminDashboardData {
    stats: {
        totalStudents: number
        activeStudents: number
        inactiveStudents: number
        totalTeachers: number
        totalClasses: number
        attendanceRate: number
        currentRevenue: number
        revenueTrend: number
        totalPending: number
    }
    chartData: { name: string; revenue: number; expenses: number }[]
    recentActivity: { id: string; type: string; title: string; description: string; time: string }[]
    upcomingExams: { id: string; subject: string; date: string; class: string }[]
    topPerformers: { id: string; name: string; score: number; class: string }[]
}

interface AdminViewProps {
    data: AdminDashboardData
    alerts: { id: string; type: string; message: string }[]
}

export function AdminView({ data, alerts }: AdminViewProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-8">
            {/* System Alerts Strip */}
            {alerts && alerts.length > 0 && (
                <div className="flex flex-col gap-3">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md p-4 transition-all hover:shadow-lg">
                            <div className={`absolute top-0 left-0 h-full w-1 ${alert.type === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${alert.type === "warning" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" : "bg-blue-100 text-blue-600 dark:bg-blue-900/20"}`}>
                                    <Bell size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{alert.message}</p>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Student Growth"
                    value={data.stats.totalStudents.toLocaleString()}
                    icon={Users}
                    description={`${data.stats.activeStudents} active students`}
                    iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                />
                <StatsCard
                    title="Daily Attendance"
                    value={`${data.stats.attendanceRate}%`}
                    icon={ClipboardCheck}
                    trend={{ value: 2.1, label: "vs last month", positive: true }}
                    iconClassName="bg-green-100 text-green-600 dark:bg-green-900/20"
                />
                <StatsCard
                    title="Monthly Revenue"
                    value={`$${data.stats.currentRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend={{ value: data.stats.revenueTrend, label: "vs last month", positive: data.stats.revenueTrend >= 0 }}
                    iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/20"
                />
                <StatsCard
                    title="Outstanding"
                    value={`$${data.stats.totalPending.toLocaleString()}`}
                    icon={Activity}
                    description="Uncollected fees"
                    iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/20"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Financial Pulse */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <div className="p-6 pb-0 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-widest text-zinc-500/50">Financial Pulse</h3>
                                <p className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
                                    ${data.stats.currentRevenue.toLocaleString()}
                                    <span className="text-sm font-medium text-green-500 flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                        <TrendingUp size={12} className="mr-1" />
                                        +{data.stats.revenueTrend}%
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full p-4">
                            <RevenueChart data={data.chartData} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Exams Section */}
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-6 overflow-hidden relative">
                            <div className="absolute -top-4 -right-4 text-zinc-100 dark:text-zinc-800/20 pointer-events-none">
                                <Award size={120} />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Upcoming Exams</h3>
                                <div className="space-y-3">
                                    {data.upcomingExams.map((exam) => (
                                        <div key={exam.id} className="flex items-center justify-between group cursor-pointer">
                                            <div>
                                                <p className="text-sm font-bold group-hover:text-blue-500 transition-colors">{exam.subject}</p>
                                                <p className="text-xs text-muted-foreground">{exam.class}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{new Date(exam.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Top Performers</h3>
                            <div className="space-y-4">
                                {data.topPerformers.map((student) => (
                                    <div key={student.id} className="space-y-1">
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="font-medium">{student.name}</span>
                                            <span className="text-blue-500 font-bold">{student.score}%</span>
                                        </div>
                                        <Progress value={student.score} className="h-1.5" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Content */}
                <div className="lg:col-span-3 space-y-6">
                    <AttendanceChart
                        present={data.stats.activeStudents}
                        absent={Math.round(data.stats.activeStudents * 0.1)}
                        late={Math.round(data.stats.activeStudents * 0.05)}
                    />

                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Activity Stream</h3>
                            <Activity size={18} className="text-zinc-300" />
                        </div>
                        <RecentActivity activities={data.recentActivity} hideCard />
                    </div>
                </div>
            </div>
        </div>
    )
}
