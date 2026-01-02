"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Filter, Plus, Eye, Printer, FileText } from "lucide-react"
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
                .select("*, students(full_name, grade)")
                .order("date", { ascending: false })

            if (error) throw error
            setInvoices(data || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const statusColors: Record<string, string> = {
        paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
        partial: "bg-blue-100 text-blue-800 border-blue-200",
        unpaid: "bg-orange-100 text-orange-800 border-orange-200",
        overdue: "bg-red-100 text-red-800 border-red-200",
        cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    }

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1E293B]">Invoices & Billing</h1>
                    <p className="text-muted-foreground">Manage and track student billing records</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/accounting/invoices/new">
                        <Button className="font-bold gap-2">
                            <Plus className="w-4 h-4" /> Create New Invoice
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Total Invoiced</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">${invoices.reduce((sum, i) => sum + Number(i.total_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Total Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-600">${invoices.reduce((sum, i) => sum + Number(i.paid_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Outstanding Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">${invoices.reduce((sum, i) => sum + Number(i.balance_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-orange-600 uppercase">Unpaid count</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-orange-900">{invoices.filter(i => i.status !== 'paid').length} Invoices</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-black text-xl">Invoice Records</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoice # or student..."
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
                                    <TableHead className="font-bold text-gray-400">Invoice No</TableHead>
                                    <TableHead className="font-bold text-gray-400">Student</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Total Amount</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Balance</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-center">Status</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((inv) => (
                                    <TableRow key={inv.id} className="border-gray-50 group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium">
                                            {format(new Date(inv.date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-xs font-mono text-muted-foreground">
                                            {inv.invoice_no}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-bold text-[#1E293B] group-hover:text-primary transition-colors">
                                                    {inv.students?.full_name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                    Grade {inv.students?.grade}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            ${Number(inv.total_amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-red-600">
                                            ${Number(inv.balance_amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={`${statusColors[inv.status]} border-none font-bold text-[10px] px-2 py-0.5 shadow-none`}>
                                                {inv.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredInvoices.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center text-muted-foreground font-bold">
                                            No invoices found.
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
