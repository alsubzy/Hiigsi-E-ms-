"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Hash, FileText, Search, Filter, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

export default function LedgerPage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchTransactions()
    }, [])

    async function fetchTransactions() {
        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select(`
          *,
          journal_entries (
            *,
            account:accounts(code, name)
          )
        `)
                .order("date", { ascending: false })

            if (error) throw error
            setTransactions(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredTransactions = transactions.filter(tx =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.journal_entries?.some((je: any) =>
            je.account?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            je.account?.code.includes(searchTerm)
        )
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">General Ledger</h2>
                    <p className="text-sm text-gray-500 font-medium">Detailed audit trail of all financial transactions across accounts.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by description, account, etc..."
                            className="pl-9 w-[350px] border-slate-200 rounded-xl"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="font-bold gap-2">
                        <Filter className="w-4 h-4" /> Date Range
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground font-bold gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        Loading ledger balances...
                    </div>
                ) : (
                    filteredTransactions.map((tx) => (
                        <Card key={tx.id} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="bg-slate-50 border-b px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white border rounded-lg px-3 py-1.5 shadow-sm flex flex-col items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            {format(new Date(tx.date), "MMM")}
                                        </span>
                                        <span className="text-lg font-black text-slate-800 leading-none">
                                            {format(new Date(tx.date), "dd")}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-slate-900 leading-tight">{tx.description}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white shadow-none px-1.5 py-0">
                                                {tx.type.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-[10px] font-mono text-slate-400">REF: {tx.reference_no || tx.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Balanced Amount</div>
                                        <div className="text-xl font-black text-slate-900 border-b-2 border-emerald-500/30">
                                            ${tx.journal_entries?.reduce((sum: number, je: any) => sum + Number(je.debit), 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50/20">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="w-[150px] font-bold text-slate-400 pl-6">GL Code</TableHead>
                                            <TableHead className="font-bold text-slate-400">Account Mapping</TableHead>
                                            <TableHead className="text-right font-bold text-slate-400">Debit ($)</TableHead>
                                            <TableHead className="text-right font-bold text-slate-400 pr-6">Credit ($)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tx.journal_entries?.map((je: any) => (
                                            <TableRow key={je.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                                                <TableCell className="pl-6 font-mono text-xs font-bold text-slate-500">
                                                    {je.account?.code}
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex flex-col ${je.credit > 0 ? "pl-8" : ""}`}>
                                                        <span className={`font-bold ${je.credit > 0 ? "text-slate-500 italic" : "text-slate-900"}`}>
                                                            {je.account?.name}
                                                        </span>
                                                        {je.notes && <span className="text-[10px] text-slate-400 mt-0.5">{je.notes}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`text-right font-black ${je.debit > 0 ? "text-blue-600" : "text-slate-200"}`}>
                                                    {je.debit > 0 ? `$${Number(je.debit).toLocaleString()}` : "-"}
                                                </TableCell>
                                                <TableCell className={`text-right pr-6 font-black ${je.credit > 0 ? "text-emerald-600" : "text-slate-200"}`}>
                                                    {je.credit > 0 ? `$${Number(je.credit).toLocaleString()}` : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))
                )}

                {(!isLoading && filteredTransactions.length === 0) && (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-3xl bg-slate-50 gap-4">
                        <FileText className="h-12 w-12 opacity-10" />
                        <div className="text-center">
                            <p className="font-black text-xl text-slate-300">No transactions found</p>
                            <p className="text-xs font-medium">Try adjusting your search or filters</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
