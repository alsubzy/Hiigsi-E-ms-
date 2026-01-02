"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Filter, Printer, Download, DollarSign, Plus, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

export default function PaymentsListPage() {
    const [payments, setPayments] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchPayments()
    }, [])

    async function fetchPayments() {
        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from("accounting_payments")
                .select("*, students(first_name, last_name, full_name), invoices(invoice_no)")
                .order("payment_date", { ascending: false })

            if (error) throw error

            // Construct full_name if not returned by view (although view usually handles it, we do it here to be safe and consistent with other pages)
            const formattedData = data?.map((p: any) => ({
                ...p,
                students: p.students ? {
                    ...p.students,
                    full_name: p.students.full_name || `${p.students.first_name} ${p.students.last_name}`
                } : null
            })) || []

            setPayments(formattedData)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredPayments = payments.filter(pay =>
        pay.payment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.invoices?.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const methodBadge = (method: string) => {
        const styles: Record<string, string> = {
            cash: "bg-emerald-50 text-emerald-700 border-emerald-200",
            bank: "bg-blue-50 text-blue-700 border-blue-200",
            mobile_money: "bg-purple-50 text-purple-700 border-purple-200",
        }
        return <Badge variant="outline" className={`${styles[method] || "bg-gray-50 text-gray-700"} capitalize font-semibold shadow-none border`}>
            {method.replace('_', ' ')}
        </Badge>
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <nav className="flex items-center text-sm text-gray-500 mb-1">
                        <Link href="/dashboard/accounting" className="hover:text-primary transition-colors">Accounting</Link>
                        <ChevronRight className="h-4 w-4 mx-1" />
                        <span className="font-semibold text-gray-900">Payments</span>
                    </nav>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payments & Receipts</h1>
                    <p className="text-gray-500">Track and manage student fee payments.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/accounting/payments/new">
                        <Button className="font-semibold shadow-sm gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="h-4 w-4" /> Record New Payment
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-none border border-gray-200 rounded-xl bg-emerald-50/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Total Collected</CardTitle>
                        <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900">${payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</div>
                        <p className="text-xs text-emerald-600/80 font-medium mt-1">All time collection</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search receipt #, student or invoice..."
                            className="pl-9 bg-white border-gray-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="gap-2 font-medium text-gray-600">
                        <Download className="w-4 h-4" /> Export CSV
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/30 hover:bg-gray-50/30">
                                <TableHead className="font-semibold text-gray-600">Payment Date</TableHead>
                                <TableHead className="font-semibold text-gray-600">Receipt No</TableHead>
                                <TableHead className="font-semibold text-gray-600">Student</TableHead>
                                <TableHead className="font-semibold text-gray-600">Invoice Ref</TableHead>
                                <TableHead className="font-semibold text-gray-600">Method</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        Loading payment records...
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        No payments found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayments.map((pay) => (
                                    <TableRow key={pay.id} className="hover:bg-gray-50 group">
                                        <TableCell className="font-medium text-gray-900">
                                            {format(new Date(pay.payment_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-gray-500 font-medium">
                                            {pay.payment_no}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-gray-900">{pay.students?.full_name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {pay.invoices?.invoice_no}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {methodBadge(pay.payment_method)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600">
                                            +${Number(pay.amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
