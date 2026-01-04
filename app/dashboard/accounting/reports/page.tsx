"use client"

import { useState, useEffect } from "react"
import { getTrialBalance } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    LayoutGrid,
    Plus,
    Search,
    Filter,
    Calendar,
    FileText,
    Download,
    Share2,
    Printer,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    LineChart,
    PieChart,
    BarChart3,
    ArrowRight,
    Wallet,
    Info,
    Building2,
    Calculator,
} from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function ReportsPage() {
    const [trialBalance, setTrialBalance] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        fetchData()
    }, [])

    async function fetchData() {
        setIsLoading(true)
        try {
            const tb = await getTrialBalance()
            setTrialBalance(tb)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const incomeAccounts = trialBalance.filter(a => a.account_type === 'income')
    const expenseAccounts = trialBalance.filter(a => a.account_type === 'expense')

    const totalRevenue = incomeAccounts.reduce((sum, a) => sum + Number(a.balance), 0)
    const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Number(a.balance), 0)
    const netIncome = totalRevenue - totalExpenses

    if (!isMounted) return null

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <PieChart size={20} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Financial Intelligence</h2>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Analytic ledger reconstruction and institutional performance audit.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold flex-1 sm:flex-none gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                        <Printer size={18} /> Print Audit
                    </Button>
                    <Button className="h-12 px-6 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black text-xs uppercase tracking-wider flex-1 sm:flex-none gap-2 shadow-xl transition-all active:scale-95">
                        <Download size={18} /> Export JSON
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="income-statement" className="w-full space-y-8">
                <div className="flex justify-center">
                    <TabsList className="h-14 bg-white dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-lg shadow-zinc-200/50 dark:shadow-none">
                        <TabsTrigger value="income-statement" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900 transition-all">
                            Income Statement
                        </TabsTrigger>
                        <TabsTrigger value="trial-balance" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900 transition-all">
                            Trial Balance
                        </TabsTrigger>
                        <TabsTrigger value="balance-sheet" className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900 transition-all">
                            Balance Sheet
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="income-statement" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "Total Asset Generation", value: totalRevenue, icon: TrendingUp, color: "blue", trend: "up" },
                            { label: "Operating Expenditure", value: totalExpenses, icon: TrendingDown, color: "rose", trend: "down" },
                            { label: "Net Institutional Gain", value: netIncome, icon: Activity, color: netIncome >= 0 ? "emerald" : "orange", trend: netIncome >= 0 ? "up" : "down" }
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                                    <CardContent className="p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12",
                                                stat.color === 'blue' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                                                    stat.color === 'rose' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" :
                                                        stat.color === 'emerald' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" :
                                                            "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                            )}>
                                                <stat.icon size={24} />
                                            </div>
                                            {stat.trend === 'up' ? <ArrowUpRight className="text-zinc-300" size={18} /> : <ArrowDownRight className="text-zinc-300" size={18} />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{stat.label}</div>
                                            <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                                ${Math.abs(stat.value).toLocaleString()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Detailed Statement */}
                    <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden">
                        <CardHeader className="p-10 bg-zinc-900 dark:bg-zinc-900 text-white border-b-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-[1.25rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                            <Building2 size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tight leading-none">Institutional Statement</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-1">Audit Protocol Verification</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                        <Calendar size={14} className="text-white/40" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Period Ending {format(new Date(), "MMM dd, yyyy")}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-12 space-y-16">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                                {/* Revenue Section */}
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <ArrowUpRight size={16} />
                                            </div>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Revenue Sources</h4>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg text-emerald-600 border-emerald-100">Positive Inflow</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        {incomeAccounts.map(acc => (
                                            <div key={acc.account_code || acc.account_name} className="flex justify-between items-center py-4 px-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-2xl transition-all group">
                                                <div className="space-y-0.5">
                                                    <div className="text-sm font-black text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{acc.account_name}</div>
                                                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{acc.account_code || "Direct Income"}</div>
                                                </div>
                                                <span className="font-black text-xl text-zinc-900 dark:text-white tracking-tighter">${Number(acc.balance).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center py-6 px-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] mt-6 border border-blue-100/50 dark:border-blue-800/20">
                                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600">Total Gross Revenue</span>
                                            <span className="font-black text-2xl text-blue-700 dark:text-blue-400 tracking-tighter">${totalRevenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expense Section */}
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                <ArrowDownRight size={16} />
                                            </div>
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Operating Expenditure</h4>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg text-rose-600 border-rose-100">Capital Outflow</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        {expenseAccounts.map(acc => (
                                            <div key={acc.account_code || acc.account_name} className="flex justify-between items-center py-4 px-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-2xl transition-all group">
                                                <div className="space-y-0.5">
                                                    <div className="text-sm font-black text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 transition-colors uppercase tracking-tight">{acc.account_name}</div>
                                                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{acc.account_code || "Operating Cost"}</div>
                                                </div>
                                                <span className="font-black text-xl text-zinc-900 dark:text-white tracking-tighter">${Number(acc.balance).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center py-6 px-8 bg-rose-50 dark:bg-rose-900/10 rounded-[2rem] mt-6 border border-rose-100/50 dark:border-rose-800/20">
                                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-rose-600">Total Expenditure</span>
                                            <span className="font-black text-2xl text-rose-700 dark:text-rose-400 tracking-tighter">${totalExpenses.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 rounded-[3rem] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                                <div className="space-y-2 relative z-10">
                                    <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Net Performance Metric</div>
                                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Net Result Statement</h2>
                                </div>
                                <div className="text-right relative z-10">
                                    <div className={cn(
                                        "text-6xl font-black tracking-tighter leading-none mb-1",
                                        netIncome >= 0 ? "text-emerald-400 dark:text-emerald-600" : "text-rose-400 dark:text-rose-600"
                                    )}>
                                        ${netIncome.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Consolidated Position (USD)</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trial-balance" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden">
                        <CardHeader className="p-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-none">Trial Balance Ledger</h3>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Double-entry verification protocol</p>
                                </div>
                                <div className="relative w-full md:w-64 group">
                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search ledger..."
                                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                        <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest pl-10 py-6">Code</TableHead>
                                        <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest py-6">Account Identity</TableHead>
                                        <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest py-6">Classification</TableHead>
                                        <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest text-right py-6">Debit Postings</TableHead>
                                        <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest text-right pr-10 py-6">Credit Postings</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-80 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Reconstructing Ledger...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        trialBalance.map((acc, index) => (
                                            <motion.tr
                                                key={acc.account_code || acc.account_name}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                                            >
                                                <TableCell className="pl-10 py-6">
                                                    <span className="font-mono text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                                        {acc.account_code || "N/A"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-black text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-tight">
                                                    {acc.account_name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-[8px] font-black tracking-widest py-0.5 px-2 bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800">
                                                        {acc.account_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right py-6">
                                                    <div className="inline-flex items-center gap-1">
                                                        {Number(acc.total_debit) > 0 && <DollarSign size={12} className="text-blue-500/40" />}
                                                        <span className={cn(
                                                            "font-black text-lg tracking-tighter",
                                                            Number(acc.total_debit) > 0 ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-800"
                                                        )}>
                                                            {Number(acc.total_debit) > 0 ? Number(acc.total_debit).toLocaleString() : "—"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-10 py-6">
                                                    <div className="inline-flex items-center gap-1">
                                                        {Number(acc.total_credit) > 0 && <DollarSign size={12} className="text-emerald-500/40" />}
                                                        <span className={cn(
                                                            "font-black text-lg tracking-tighter",
                                                            Number(acc.total_credit) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-300 dark:text-zinc-800"
                                                        )}>
                                                            {Number(acc.total_credit) > 0 ? Number(acc.total_credit).toLocaleString() : "—"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="balance-sheet" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden">
                        <CardContent className="p-24 flex flex-col items-center justify-center text-center gap-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-200 dark:text-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                <Calculator size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-2xl text-zinc-900 dark:text-white uppercase tracking-tighter">Balance Sheet Protocol</h3>
                                <p className="text-sm text-zinc-500 font-medium max-w-sm mx-auto leading-relaxed italic">
                                    The automated balance sheet generator is currently under architectural verification. This module will be activated in the next ledger revision.
                                </p>
                            </div>
                            <Button variant="outline" className="h-11 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] opacity-40 grayscale pointer-events-none">
                                Request Access
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
