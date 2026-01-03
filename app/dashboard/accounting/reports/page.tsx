"use client"

import { useState, useEffect } from "react"
import { getTrialBalance } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Printer, Download, TrendingUp, TrendingDown, Calculator } from "lucide-react"

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
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1E293B]">Financial Reports</h1>
                    <p className="text-muted-foreground whitespace-nowrap">Detailed financial statements and real-time ledger analysis</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="font-bold gap-2">
                        <Printer className="w-4 h-4" /> Print
                    </Button>
                    <Button className="font-bold gap-2">
                        <Download className="w-4 h-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="income-statement" className="w-full">
                <TabsList className="bg-gray-100 p-1 rounded-xl mb-6">
                    <TabsTrigger value="income-statement" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Income Statement</TabsTrigger>
                    <TabsTrigger value="trial-balance" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Trial Balance</TabsTrigger>
                    <TabsTrigger value="balance-sheet" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Balance Sheet</TabsTrigger>
                </TabsList>

                <TabsContent value="income-statement" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm bg-green-50 border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-green-600 uppercase">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-green-900">${totalRevenue.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-red-50 border-l-4 border-l-red-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-red-600 uppercase">Total Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-red-900">-${totalExpenses.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-blue-600 uppercase">Net Income</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-blue-900">${netIncome.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-sm">
                        <CardHeader className="border-b bg-gray-50/50">
                            <CardTitle className="text-xl font-black">Statement of Comprehensive Income</CardTitle>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">For the period ending {format(new Date(), "MMMM dd, yyyy")}</p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-8">
                                <div>
                                    <h4 className="font-black text-lg mb-4 flex items-center gap-2 border-b pb-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" /> REVENUE
                                    </h4>
                                    <div className="space-y-2">
                                        {incomeAccounts.map(acc => (
                                            <div key={acc.account_code || acc.account_name} className="flex justify-between items-center py-2 px-4 hover:bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-600">{acc.account_name}</span>
                                                <span className="font-black text-green-600">${Number(acc.balance).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center py-4 px-4 bg-green-100/50 rounded-lg mt-4">
                                            <span className="font-black text-green-800">TOTAL REVENUE</span>
                                            <span className="font-black text-green-800">${totalRevenue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-black text-lg mb-4 flex items-center gap-2 border-b pb-2">
                                        <TrendingDown className="w-5 h-5 text-red-500" /> EXPENSES
                                    </h4>
                                    <div className="space-y-2">
                                        {expenseAccounts.map(acc => (
                                            <div key={acc.account_code || acc.account_name} className="flex justify-between items-center py-2 px-4 hover:bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-600">{acc.account_name}</span>
                                                <span className="font-black text-red-600">${Number(acc.balance).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center py-4 px-4 bg-red-100/50 rounded-lg mt-4">
                                            <span className="font-black text-red-800">TOTAL OPERATING EXPENSES</span>
                                            <span className="font-black text-red-800">${totalExpenses.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-xl shadow-lg mt-8">
                                    <div className="flex flex-col">
                                        <span className="text-xs uppercase font-bold tracking-[0.2em] text-slate-400">Net Financial Result</span>
                                        <span className="text-2xl font-black">NET PROFIT / (LOSS)</span>
                                    </div>
                                    <span className={`text-4xl font-black ${netIncome >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        ${netIncome.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trial-balance">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="border-b bg-gray-50/50">
                            <CardTitle className="text-xl font-black">Trial Balance</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        <TableHead className="font-bold text-gray-400 pl-6">Code</TableHead>
                                        <TableHead className="font-bold text-gray-400">Account Name</TableHead>
                                        <TableHead className="font-bold text-gray-400">Type</TableHead>
                                        <TableHead className="font-bold text-gray-400 text-right">Debit</TableHead>
                                        <TableHead className="font-bold text-gray-400 text-right pr-6">Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center font-bold text-muted-foreground">Loading reports...</TableCell>
                                        </TableRow>
                                    ) : (
                                        trialBalance.map((acc) => (
                                            <TableRow key={acc.account_code || acc.account_name} className="border-gray-50">
                                                <TableCell className="pl-6 font-bold text-xs font-mono text-muted-foreground">{acc.account_code}</TableCell>
                                                <TableCell className="font-bold">{acc.account_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-[10px] font-bold">
                                                        {acc.account_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-blue-600">
                                                    {Number(acc.total_debit) > 0 ? `$${Number(acc.total_debit).toLocaleString()}` : "-"}
                                                </TableCell>
                                                <TableCell className="text-right pr-6 font-bold text-green-600">
                                                    {Number(acc.total_credit) > 0 ? `$${Number(acc.total_credit).toLocaleString()}` : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="balance-sheet">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                            <Calculator className="w-16 h-16 opacity-10" />
                            <p className="font-black text-xl text-gray-300 uppercase tracking-widest">Balance Sheet Generator</p>
                            <Badge variant="secondary" className="font-bold">Coming Soon</Badge>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
