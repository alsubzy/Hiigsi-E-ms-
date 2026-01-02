"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Filter, Printer, Download, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

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
                .select("*, students(full_name), invoices(invoice_no)")
                .order("payment_date", { ascending: false })

            if (error) throw error
            setPayments(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const methodColors: Record<string, string> = {
        cash: "bg-emerald-50 text-emerald-700 border-emerald-100",
        bank: "bg-blue-50 text-blue-700 border-blue-100",
        mobile_money: "bg-purple-50 text-purple-700 border-purple-100",
    }

    const filteredPayments = payments.filter(pay =>
        pay.payment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.invoices?.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1E293B]">Payments & Receipts</h1>
                    <p className="text-muted-foreground">Historical records of all student fee collections</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="font-bold gap-2">
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-emerald-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-emerald-600 uppercase">Total Collected</CardTitle>
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-900">${payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</div>
                        <p className="text-xs text-emerald-600/60 font-medium">All time collection</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-black text-xl">Recent Payments</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search receipt #, student or invoice..."
                                    className="pl-9 w-[300px]"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="gap-2">
                                <Filter className="w-4 h-4" /> Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-40 flex items-center justify-center text-muted-foreground font-bold">Loading records...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead className="font-bold text-gray-400">Date</TableHead>
                                    <TableHead className="font-bold text-gray-400">Receipt No</TableHead>
                                    <TableHead className="font-bold text-gray-400">Student</TableHead>
                                    <TableHead className="font-bold text-gray-400">Invoice Ref</TableHead>
                                    <TableHead className="font-bold text-gray-400">Method</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Amount</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.map((pay) => (
                                    <TableRow key={pay.id} className="border-gray-50 group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium">
                                            {format(new Date(pay.payment_date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-xs font-mono text-muted-foreground">
                                            {pay.payment_no}
                                        </TableCell>
                                        <TableCell className="font-bold text-[#1E293B]">
                                            {pay.students?.full_name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold text-[10px] uppercase bg-gray-50">
                                                {pay.invoices?.invoice_no}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${methodColors[pay.payment_method] || ""} border-none font-bold text-[10px] uppercase shadow-none`}>
                                                {pay.payment_method.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-emerald-600">
                                            +${Number(pay.amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredPayments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center text-muted-foreground font-bold">
                                            No payment records found.
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
