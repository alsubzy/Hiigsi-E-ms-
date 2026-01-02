"use client"

import { useState, useEffect } from "react"
import { getAuditLogs } from "@/app/actions/accounting"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { ShieldAlert, History, User, Activity } from "lucide-react"

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [])

    async function fetchLogs() {
        try {
            const data = await getAuditLogs(200)
            setLogs(data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case "INSERT": return "bg-green-100 text-green-700"
            case "UPDATE": return "bg-blue-100 text-blue-700"
            case "DELETE": return "bg-red-100 text-red-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1E293B]">Accounting Audit Trail</h1>
                    <p className="text-muted-foreground">Monitor all financial modifications and administrative actions</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-sm border border-red-100">
                    <ShieldAlert className="w-5 h-5" />
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <History className="w-5 h-5 text-primary" />
                        System Modification Logs
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-60 flex flex-col items-center justify-center text-muted-foreground font-bold gap-2">
                            <Activity className="w-8 h-8 animate-spin text-primary" />
                            Fetching audit records...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead className="font-bold text-gray-400 pl-6">Timestamp</TableHead>
                                    <TableHead className="font-bold text-gray-400">User</TableHead>
                                    <TableHead className="font-bold text-gray-400">Action</TableHead>
                                    <TableHead className="font-bold text-gray-400">Module</TableHead>
                                    <TableHead className="font-bold text-gray-400">Context</TableHead>
                                    <TableHead className="font-bold text-gray-400 pr-6">Record ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="border-gray-50 group transition-colors hover:bg-gray-50/50">
                                        <TableCell className="pl-6 font-medium text-xs whitespace-nowrap">
                                            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                                <User className="w-3 h-3 text-muted-foreground" />
                                                {log.users?.email || "System/Trigger"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getActionColor(log.action) + " border-none font-black text-[10px]"}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize font-bold text-xs text-primary">
                                            {log.table_name.replace(/_/g, " ")}
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate">
                                            <span className="text-xs text-muted-foreground italic">
                                                {log.action === "UPDATE"
                                                    ? `Modified ${Object.keys(log.new_data || {}).length} fields`
                                                    : log.action === "INSERT"
                                                        ? "Created new record"
                                                        : "Removed record from system"
                                                }
                                            </span>
                                        </TableCell>
                                        <TableCell className="pr-6 font-mono text-[10px] text-gray-400">
                                            {log.record_id}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-bold italic">
                                            No audit logs recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
