"use client"

import { Users, ClipboardCheck, BookOpen, Clock, Calendar, CheckCircle2, ChevronRight, Activity } from "lucide-react"
import { StatsCard } from "@/components/dashboard/widgets/stats-card"
import { RecentActivity, type ActivityItem } from "@/components/dashboard/widgets/recent-activity"
import { useLanguage } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"

export interface TeacherDashboardData {
    stats: {
        assignedClasses: number
        totalStudents: number
        hoursToday: number
        attendanceRate: number
    }
    todaySchedule: { id: string; time: string; subject: string; class: string }[]
    recentActivity?: ActivityItem[]
}

interface TeacherViewProps {
    data: TeacherDashboardData
}

export function TeacherView({ data }: TeacherViewProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Assigned Classes"
                    value={data.stats.assignedClasses}
                    icon={BookOpen}
                    description="Active sections"
                    iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                />
                <StatsCard
                    title="Assigned Students"
                    value={data.stats.totalStudents}
                    icon={Users}
                    description="Total roster"
                    iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/20"
                />
                <StatsCard
                    title="Scheduled Hours"
                    value={`${data.stats.hoursToday}h`}
                    icon={Clock}
                    description="Total today"
                    iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/20"
                />
                <StatsCard
                    title="Attendance Rate"
                    value={`${data.stats.attendanceRate}%`}
                    icon={ClipboardCheck}
                    trend={{ value: 1.2, label: "vs avg", positive: true }}
                    iconClassName="bg-green-100 text-green-600 dark:bg-green-900/20"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Today&apos;s Schedule</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">You have {data.todaySchedule.length} sessions today</p>
                            </div>
                            <Calendar size={18} className="text-zinc-300" />
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {data.todaySchedule.map((session) => (
                                <div key={session.id} className="p-6 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="text-center min-w-[60px]">
                                            <p className="text-xs font-black text-blue-500 uppercase">{session.time.split(' ')[1]}</p>
                                            <p className="text-lg font-black tracking-tighter leading-none">{session.time.split(' ')[0]}</p>
                                        </div>
                                        <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800" />
                                        <div>
                                            <p className="font-bold tracking-tight">{session.subject}</p>
                                            <p className="text-xs text-muted-foreground">{session.class}</p>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-blue-500 transition-colors">
                                        Start Session <ChevronRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar widgets */}
                <div className="space-y-6">
                    {/* Quick Attendance */}
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle2 size={120} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-widest opacity-80">Quick Mark</h3>
                            <p className="text-2xl font-black mt-2">Class Attendance</p>
                            <p className="text-sm opacity-80 mt-1">Mark today&apos;s attendance for your assigned sections.</p>
                            <button className="mt-6 w-full py-3 bg-white text-blue-600 rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 active:translate-y-0">
                                Open Attendance Tool
                            </button>
                        </div>
                    </div>

                    {/* School Activity */}
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">School Activity</h3>
                            <Activity size={18} className="text-zinc-300" />
                        </div>
                        <RecentActivity activities={data.recentActivity || []} hideCard />
                    </div>
                </div>
            </div>
        </div>
    )
}
