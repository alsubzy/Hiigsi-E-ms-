"use client"

import { useState, useEffect } from "react"
import { getAccounts } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FolderTree, ChevronRight, ChevronDown, Activity, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export default function COAPage() {
    const [accounts, setAccounts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const data = await getAccounts()
            setAccounts(data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const typeColors: Record<string, string> = {
        asset: "bg-blue-50 text-blue-700 border-blue-100",
        liability: "bg-red-50 text-red-700 border-red-100",
        equity: "bg-purple-50 text-purple-700 border-purple-100",
        income: "bg-emerald-50 text-emerald-700 border-emerald-100",
        expense: "bg-orange-50 text-orange-700 border-orange-100",
    }

    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.includes(searchTerm)
    )

    // Group accounts by type for the summary
    const summary = accounts.reduce((acc: any, curr: any) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1
        return acc
    }, {})

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Chart of Accounts</h2>
                    <p className="text-sm text-gray-500 font-medium">Standard school financial structure and GL account mapping</p>
                </div>
                <div className="flex gap-2">
                    <Button className="font-bold gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /> Add GL Account
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(summary).map(([type, count]: [any, any]) => (
                    <Card key={type} className="border-none shadow-sm overflow-hidden group">
                        <div className={`h-1 w-full ${typeColors[type]?.split(' ')[0]}`} />
                        <CardContent className="pt-4">
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{type}s</div>
                            <div className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors">{count}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Financial GL Map</CardTitle>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Filter by code or name..."
                                className="pl-9 w-[300px] border-slate-200 rounded-xl font-medium"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-60 flex flex-col items-center justify-center text-muted-foreground font-bold gap-2">
                            <Activity className="w-8 h-8 animate-spin text-primary" />
                            Initializing Ledger Schema...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/20">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="font-bold text-slate-400 pl-6 w-[120px]">Account Code</TableHead>
                                    <TableHead className="font-bold text-slate-400">Account Name</TableHead>
                                    <TableHead className="font-bold text-slate-400">Classification</TableHead>
                                    <TableHead className="font-bold text-slate-400">Description</TableHead>
                                    <TableHead className="font-bold text-slate-400 text-center pr-6">System Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAccounts.map((acc) => (
                                    <TableRow key={acc.id} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 font-mono text-xs font-black text-slate-500">
                                            {acc.code}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {acc.parent_id && <ChevronRight className="w-3 h-3 text-slate-300" />}
                                                <span className={`font-bold transition-colors ${acc.parent_id ? "text-slate-500 text-sm" : "text-slate-900"}`}>
                                                    {acc.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${typeColors[acc.type] || ""} border-none font-black text-[9px] uppercase tracking-widest px-2 py-1 shadow-none`}>
                                                {acc.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-400 text-xs italic max-w-[300px] truncate">
                                            {acc.description || "—"}
                                        </TableCell>
                                        <TableCell className="text-center pr-6">
                                            {acc.is_active ? (
                                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 font-bold text-[10px]">VERIFIED</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-400 border-slate-200 font-bold text-[10px]">DISABLED</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}
