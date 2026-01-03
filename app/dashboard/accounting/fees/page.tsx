"use client"

import { useState, useEffect } from "react"
import { getStudentFees, updateStudentFee, deleteStudentFee, getFeeCategories } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Receipt, Download, ChevronRight, MoreVertical, Edit2, Trash2, XCircle, Users } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
import { BulkFeeAssignment } from "@/components/dashboard/accounting/bulk-fee-assignment"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function FeesPage() {
    const [fees, setFees] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filters
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [classFilter, setClassFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

    // Actions state
    const [selectedFee, setSelectedFee] = useState<any>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [editData, setEditData] = useState({
        discount_amount: 0,
        late_fee_amount: 0,
        discount_reason: "",
        status: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [data, catData] = await Promise.all([
                getStudentFees(),
                getFeeCategories()
            ])
            setFees(data)
            setCategories(catData)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedFee) return
        setIsActionLoading(true)
        try {
            await deleteStudentFee(selectedFee.id)
            toast.success("Fee assignment removed successfully")
            setFees(fees.filter(f => f.id !== selectedFee.id))
            setIsDeleteDialogOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleEditClick = (fee: any) => {
        setSelectedFee(fee)
        setEditData({
            discount_amount: Number(fee.discount_amount),
            late_fee_amount: Number(fee.late_fee_amount),
            discount_reason: fee.discount_reason || "",
            status: fee.status
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdate = async () => {
        if (!selectedFee) return
        setIsActionLoading(true)
        try {
            await updateStudentFee(selectedFee.id, editData)
            toast.success("Fee assignment updated")
            fetchData()
            setIsEditDialogOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsActionLoading(false)
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

    const filteredFees = fees.filter(f => {
        const matchesSearch = f.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.fee_structures?.fee_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === "all" || f.fee_structures?.fee_category_id === categoryFilter
        const matchesClass = classFilter === "all" || f.students?.class_name === classFilter
        const matchesStatus = statusFilter === "all" || f.status === statusFilter
        return matchesSearch && matchesCategory && matchesClass && matchesStatus
    })

    const exportToCSV = () => {
        const headers = ["Student", "Class", "Category", "Base", "Discount", "Late Fee", "Net", "Status"]
        const csvContent = [
            headers.join(","),
            ...filteredFees.map(f => [
                f.students?.full_name,
                f.students?.class_name,
                f.fee_structures?.fee_categories?.name,
                f.amount,
                f.discount_amount,
                f.late_fee_amount,
                f.net_amount,
                f.status
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `student_fees_${format(new Date(), "yyyy-MM-dd")}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const allClasses = Array.from(new Set(fees.map(f => f.students?.class_name).filter(Boolean))).sort()

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Student Fees Assignments
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Overview of all student fee assignments and balances.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV} className="font-semibold gap-2 border-gray-200">
                        <Download className="w-4 h-4" /> Export records
                    </Button>
                    <BulkFeeAssignment onSuccess={fetchData} />
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
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Find students..."
                            className="pl-9 bg-white border-gray-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-gray-400">Class</span>
                            <select
                                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={classFilter}
                                onChange={e => setClassFilter(e.target.value)}
                            >
                                <option value="all">All Classes</option>
                                {allClasses.map(g => <option key={g} value={g}>Class {g}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-gray-400">Category</span>
                            <select
                                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">All Fees</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-gray-400">Status</span>
                            <select
                                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="h-48 flex items-center justify-center text-muted-foreground font-bold animate-pulse uppercase tracking-widest">Compiling Records...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/30 hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-600">Student</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Category</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Base</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Discount</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Late Fee</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Net Due</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Status</TableHead>
                                    <TableHead className="w-[80px] pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                                            {searchTerm ? "No records match your search." : "No fee records found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFees.map((fee) => (
                                        <TableRow key={fee.id} className="hover:bg-gray-50 border-gray-100 group">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{fee.students?.full_name}</span>
                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mt-1">Class {fee.students?.class_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-black text-[10px] uppercase text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5">
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
                                            <TableCell className="text-right font-black text-gray-900">
                                                ${Number(fee.net_amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {statusBadge(fee.status)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-200">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl overflow-hidden shadow-xl border-gray-100">
                                                        <DropdownMenuItem
                                                            className="gap-2 font-bold cursor-pointer"
                                                            onClick={() => handleEditClick(fee)}
                                                        >
                                                            <Edit2 className="w-4 h-4 text-emerald-500" /> Adjust Fee
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-2 font-bold cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                                                            onClick={() => {
                                                                setSelectedFee(fee)
                                                                setIsDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-2xl">Remove Assignment?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-gray-500 text-lg">
                            This will remove the <span className="text-blue-600 font-bold">{selectedFee?.fee_structures?.fee_categories?.name}</span> fee from <span className="text-gray-900 font-bold">{selectedFee?.students?.full_name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold" disabled={isActionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-6 shadow-xl shadow-red-200"
                            onClick={handleDelete}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? "Removing..." : "Confirm Removal"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Quick Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="rounded-3xl max-w-md p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Adjust Student Fee</DialogTitle>
                        <DialogDescription className="font-medium text-gray-500">
                            Updating record for {selectedFee?.students?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Discount ($)</Label>
                                <Input
                                    type="number"
                                    value={editData.discount_amount}
                                    onChange={e => setEditData({ ...editData, discount_amount: Number(e.target.value) })}
                                    className="h-12 rounded-xl bg-gray-50 border-transparent focus:ring-2 focus:ring-blue-500/20 font-black text-blue-600 text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Late Fee ($)</Label>
                                <Input
                                    type="number"
                                    value={editData.late_fee_amount}
                                    onChange={e => setEditData({ ...editData, late_fee_amount: Number(e.target.value) })}
                                    className="h-12 rounded-xl bg-gray-50 border-transparent focus:ring-2 focus:ring-blue-500/20 font-black text-red-600 text-lg"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Discount Reason</Label>
                            <Input
                                value={editData.discount_reason}
                                onChange={e => setEditData({ ...editData, discount_reason: e.target.value })}
                                placeholder="Scholarship, sibling, etc."
                                className="h-12 rounded-xl bg-gray-50 border-transparent focus:ring-2 focus:ring-blue-500/20 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Status</Label>
                            <select
                                className="w-full h-12 rounded-xl bg-gray-50 border-transparent px-4 font-bold outline-none ring-offset-background focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                value={editData.status}
                                onChange={e => setEditData({ ...editData, status: e.target.value })}
                            >
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-gray-100 flex gap-3">
                        <Button
                            variant="ghost"
                            className="rounded-xl font-bold flex-1"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isActionLoading}
                        >
                            Discard
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black flex-1 shadow-lg shadow-blue-200"
                            onClick={handleUpdate}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? "Saving..." : "Apply Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
