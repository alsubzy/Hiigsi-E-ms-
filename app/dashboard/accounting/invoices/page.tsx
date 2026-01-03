"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Filter, Plus, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchInvoices()
    }, [])

    async function fetchInvoices() {
        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from("invoices")
                .select("*, students(first_name, last_name, grade)")
                .order("date", { ascending: false })

            if (error) throw error

            // Map the nested students object to include full_name for easier filtering/display
            const formattedData = data?.map((inv: any) => ({
                ...inv,
                students: inv.students ? {
                    ...inv.students,
                    full_name: `${inv.students.first_name} ${inv.students.last_name}`
                } : null
            })) || []

            setInvoices(formattedData)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
            partial: "bg-blue-50 text-blue-700 border-blue-200",
            unpaid: "bg-orange-50 text-orange-700 border-orange-200",
            overdue: "bg-red-50 text-red-700 border-red-200",
            cancelled: "bg-gray-50 text-gray-700 border-gray-200",
        }
        return <Badge variant="outline" className={`${styles[status] || styles.unpaid} capitalize font-semibold shadow-none`}>{status}</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Invoices Directory</h2>
                    <p className="text-sm text-gray-500">View, manage, and print student invoices.</p>
                </div>
                <Link href="/dashboard/accounting/invoices/new">
                    <Button className="font-semibold shadow-sm gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4" /> Create Invoice
                    </Button>
                </Link>
            </div>

            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by invoice number or student name..."
                            className="pl-9 bg-white border-gray-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/30 hover:bg-gray-50/30">
                                <TableHead className="w-[180px] font-semibold text-gray-600">Invoice No</TableHead>
                                <TableHead className="font-semibold text-gray-600">Student</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Date</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Balance</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Status</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        Loading invoices...
                                    </TableCell>
                                </TableRow>
                            ) : filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        No invoices found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <TableRow key={inv.id} className="hover:bg-gray-50 cursor-pointer group">
                                        <TableCell className="font-mono text-sm font-medium text-gray-700">
                                            {inv.invoice_no}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{inv.students?.full_name}</span>
                                                <span className="text-xs text-gray-500">Grade {inv.students?.grade}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-gray-600">
                                            {format(new Date(inv.date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-gray-900">
                                            ${inv.total_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-red-600">
                                            ${inv.balance_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {statusBadge(inv.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/dashboard/accounting/invoices/${inv.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <FileText className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </Link>
                                            </div>
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

