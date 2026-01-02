"use client"

import { useState, useEffect } from "react"
import { getStudentFees } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Receipt, Download } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

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

    const statusColors: Record<string, string> = {
        paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
        partial: "bg-blue-100 text-blue-800 border-blue-200",
        pending: "bg-orange-100 text-orange-800 border-orange-200",
        overdue: "bg-red-100 text-red-800 border-red-200",
        cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    }

    const filteredFees = fees.filter(f =>
        f.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.fee_structures?.fee_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1E293B]">Student Fee Management</h1>
                    <p className="text-muted-foreground whitespace-nowrap">Manage tuition, transport, and auxiliary fees with discounts and late fee tracking</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="font-bold gap-2">
                        <Download className="w-4 h-4" /> Export records
                    </Button>
                    <Button className="font-bold gap-2">
                        <Plus className="w-4 h-4" /> Bulk Assign Fees
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Total Invoiced</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">${fees.reduce((sum, f) => sum + Number(f.amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Discounts/Scholarships</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-blue-600">-${fees.reduce((sum, f) => sum + Number(f.discount_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Late Fees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">+${fees.reduce((sum, f) => sum + Number(f.late_fee_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase opacity-80">Net Receivables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">${fees.reduce((sum, f) => sum + Number(f.net_amount), 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-black text-xl">Fee Records</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search students or categories..."
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
                                    <TableHead className="font-bold text-gray-400">Student</TableHead>
                                    <TableHead className="font-bold text-gray-400">Category</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Base Amount</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Discount</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Late Fee</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Net Due</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-center">Status</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFees.map((fee) => (
                                    <TableRow key={fee.id} className="border-gray-50 group hover:bg-gray-50/50 transition-colors">
                                        <TableCell>
                                            <div>
                                                <div className="font-bold text-[#1E293B] group-hover:text-primary transition-colors">
                                                    {fee.students?.full_name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                    Grade {fee.students?.grade}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold text-[10px] uppercase bg-gray-50 py-0.5">
                                                {fee.fee_structures?.fee_categories?.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-gray-500">
                                            ${Number(fee.amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-blue-600">
                                            {Number(fee.discount_amount) > 0 ? `-$${Number(fee.discount_amount).toLocaleString()}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-red-500">
                                            {Number(fee.late_fee_amount) > 0 ? `+$${Number(fee.late_fee_amount).toLocaleString()}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-gray-900">
                                            ${Number(fee.net_amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={`${statusColors[fee.status]} border-none font-bold text-[10px] px-2 py-0.5 shadow-none`}>
                                                {fee.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="font-bold text-primary gap-1">
                                                <Receipt className="w-3.5 h-3.5" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredFees.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-40 text-center text-muted-foreground font-bold">
                                            {searchTerm ? "No records match your search criteria." : "No fee records assigned yet."}
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
