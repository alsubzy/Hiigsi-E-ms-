import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface ActivityItem {
    id: string
    user?: {
        name: string
        image?: string
        initials: string
    }
    title?: string // New field
    description?: string // New field
    action?: string
    target?: string
    time: string
}

interface RecentActivityProps {
    activities: ActivityItem[]
    className?: string
    hideCard?: boolean
}

export function RecentActivity({ activities, className, hideCard }: RecentActivityProps) {
    const content = (
        <div className="space-y-6">
            {activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
            {activities.map((item) => (
                <div key={item.id} className="flex items-start group">
                    <div className="relative">
                        <Avatar className="h-9 w-9 border border-zinc-100 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-110">
                            {item.user ? (
                                <>
                                    <AvatarImage src={item.user.image} alt={item.user.name} />
                                    <AvatarFallback className="bg-zinc-50 dark:bg-zinc-900 border-none text-[10px] font-bold">{item.user.initials}</AvatarFallback>
                                </>
                            ) : (
                                <AvatarFallback className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 border-none text-[10px] font-bold">SY</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 bg-green-500" />
                    </div>
                    <div className="ml-4 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold leading-none tracking-tight">
                                {item.title || item.user?.name}
                            </p>
                            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                                {item.time}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.description || item.action} {item.target && <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.target}</span>}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )

    if (hideCard) return content

    return (
        <Card className={cn("rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm", className)}>
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {content}
            </CardContent>
        </Card>
    )
}
