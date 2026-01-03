"use client"

import { useState, useEffect } from "react"
import { getStudentFees } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Receipt, Download, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

export default function FeesPage() {
    const [fees, setFees] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const data = await getStudentFees()
            setFees(data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
            partial: "bg-blue-50 text-blue-700 border-blue-200",
            pending: "bg-orange-50 text-orange-700 border-orange-200",
            overdue: "bg-red-50 text-red-700 border-red-200",
            cancelled: "bg-gray-50 text-gray-700 border-gray-200",
        }
        return <Badge variant="outline" className={`${styles[status] || styles.pending} capitalize font-semibold shadow-none border`}>{status}</Badge>
    }

    const filteredFees = fees.filter(f =>
        f.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.fee_structures?.fee_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Student Fees Assignments</h2>
                    <p className="text-sm text-gray-500 font-medium">Overview of all student fee assignments and balances.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="font-semibold gap-2 border-gray-200">
                        <Download className="w-4 h-4" /> Export records
                    </Button>
                    <Button className="font-semibold gap-2" disabled>
                        <Plus className="w-4 h-4" /> Bulk Assign Fees
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-none border border-gray-200 rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Invoiced</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">${fees.reduce((sum, f) => sum + Number(f.amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-none border border-gray-200 rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">-${fees.reduce((sum, f) => sum + Number(f.discount_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-none border border-gray-200 rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Late Fees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">+${fees.reduce((sum, f) => sum + Number(f.late_fee_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-none border border-gray-200 rounded-xl bg-gray-900 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase opacity-80 tracking-wide">Net Receivables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${fees.reduce((sum, f) => sum + Number(f.net_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search students or fee types..."
                            className="pl-9 bg-white border-gray-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">Loading fee records...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/30 hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-600">Student</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Fee Category</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Base Amount</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Discount</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Late Fee</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Net Due</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                            {searchTerm ? "No records match your search." : "No fee records found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFees.map((fee) => (
                                        <TableRow key={fee.id} className="hover:bg-gray-50 border-gray-100">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{fee.students?.full_name}</span>
                                                    <span className="text-xs text-gray-500">Grade {fee.students?.grade}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-medium text-gray-700 bg-gray-100">
                                                    {fee.fee_structures?.fee_categories?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-gray-500">
                                                ${Number(fee.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-blue-600">
                                                {Number(fee.discount_amount) > 0 ? `-$${Number(fee.discount_amount).toLocaleString()}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-red-600">
                                                {Number(fee.late_fee_amount) > 0 ? `+$${Number(fee.late_fee_amount).toLocaleString()}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-gray-900">
                                                ${Number(fee.net_amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {statusBadge(fee.status)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>
        </div>
    )
}
