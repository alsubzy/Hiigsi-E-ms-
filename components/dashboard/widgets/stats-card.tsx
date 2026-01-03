import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
        value: number
        label: string
        positive?: boolean
    }
    className?: string
    iconClassName?: string
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    className,
    iconClassName,
}: StatsCardProps) {
    return (
        <Card className={cn("overflow-hidden border-zinc-100 dark:border-zinc-800 shadow-sm", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("p-2 rounded-full bg-blue-50 dark:bg-blue-900/10", iconClassName)}>
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {trend && (
                            <span
                                className={cn(
                                    "flex items-center font-medium",
                                    trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                )}
                            >
                                {trend.positive ? "+" : ""}
                                {trend.value}%
                            </span>
                        )}
                        {description && (
                            <span className={cn(trend ? "ml-2" : "")}>{description}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
