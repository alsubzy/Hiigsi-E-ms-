import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ActivityItem {
    id: string
    user: {
        name: string
        image?: string
        initials: string
    }
    action: string
    target?: string
    time: string
}

interface RecentActivityProps {
    activities: ActivityItem[]
    className?: string
}

export function RecentActivity({ activities, className }: RecentActivityProps) {
    return (
        <Card className={cn("col-span-1", className)}>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {activities.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                    {activities.map((item) => (
                        <div key={item.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={item.user.image} alt={item.user.name} />
                                <AvatarFallback>{item.user.initials}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {item.user.name}{" "}
                                    <span className="text-muted-foreground font-normal">
                                        {item.action} {item.target && <span className="font-medium text-foreground">{item.target}</span>}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {item.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
