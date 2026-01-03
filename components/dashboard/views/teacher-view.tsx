"use client"

import { Users, ClipboardCheck, BookOpen, Clock } from "lucide-react"
import { StatsCard } from "@/components/dashboard/widgets/stats-card"
import { RecentActivity } from "@/components/dashboard/widgets/recent-activity"

export interface TeacherDashboardData {
    stats: {
        classes: number
        students: number
        hoursToday: number
        attendanceRate: number
    }
    recentActivity: any[]
}

interface TeacherViewProps {
    data: TeacherDashboardData
}

import { useLanguage } from "@/components/language-provider"

export function TeacherView({ data }: TeacherViewProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title={t("teachers.schedule")}
                    value={data.stats.classes}
                    icon={BookOpen}
                    description="Active classes"
                    iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                />
                <StatsCard
                    title={t("students.students")}
                    value={data.stats.students}
                    icon={Users}
                    description="Total students"
                    iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/20"
                />
                <StatsCard
                    title={t("teachers.schedule")} // or hours
                    value={`${data.stats.hoursToday}h`}
                    icon={Clock}
                    description="Scheduled today"
                    iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/20"
                />
                <StatsCard
                    title={t("students.attendance")}
                    value={`${data.stats.attendanceRate}%`}
                    icon={ClipboardCheck}
                    trend={{ value: 1.2, label: "vs avg", positive: true }}
                    iconClassName="bg-green-100 text-green-600 dark:bg-green-900/20"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                <RecentActivity activities={data.recentActivity} />
            </div>
        </div>
    )
}
