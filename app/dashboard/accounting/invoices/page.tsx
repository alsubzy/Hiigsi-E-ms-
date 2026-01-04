"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Filter, Plus, FileText, Download, MoreVertical, Edit2, Trash2, Calendar, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
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
import { Textarea } from "@/components/ui/textarea"
import { deleteInvoice, updateInvoice } from "@/app/actions/accounting"

export default function InvoicesListPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    // Select labels and actions
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [isActionLoading, setIsActionLoading] = useState(false)

    // Edit form state
    const [editData, setEditData] = useState({
        due_date: "",
        notes: ""
    })

    useEffect(() => {
        fetchInvoices()
    }, [])

    async function fetchInvoices() {
        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from("invoices")
                .select("*, students(first_name, last_name, sections(classes(name)))")
                .order("date", { ascending: false })

            if (error) throw error

            const formattedData = data?.map((inv: any) => ({
                ...inv,
                students: inv.students ? {
                    ...inv.students,
                    full_name: `${inv.students.first_name} ${inv.students.last_name}`,
                    classes: inv.students.sections?.classes
                } : null
            })) || []

            setInvoices(formattedData)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedInvoice) return
        setIsActionLoading(true)
        try {
            await deleteInvoice(selectedInvoice.id)
            toast.success("Invoice deleted successfully")
            setInvoices(invoices.filter(i => i.id !== selectedInvoice.id))
            setIsDeleteDialogOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleEditClick = (inv: any) => {
        setSelectedInvoice(inv)
        setEditData({
            due_date: format(new Date(inv.due_date), "yyyy-MM-dd"),
            notes: inv.notes || ""
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdate = async () => {
        if (!selectedInvoice) return
        setIsActionLoading(true)
        try {
            await updateInvoice(selectedInvoice.id, editData)
            toast.success("Invoice updated successfully")
            fetchInvoices()
            setIsEditDialogOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsActionLoading(false)
        }
    }

    const exportToCSV = () => {
        const headers = ["Invoice No", "Student", "Date", "Due Date", "Amount", "Balance", "Status"]
        const csvContent = [
            headers.join(","),
            ...filteredInvoices.map(inv => [
                inv.invoice_no,
                inv.students?.full_name,
                format(new Date(inv.date), "yyyy-MM-dd"),
                format(new Date(inv.due_date), "yyyy-MM-dd"),
                inv.total_amount,
                inv.balance_amount,
                inv.status
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `invoices_${format(new Date(), "yyyy-MM-dd")}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.students?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
            partial: "bg-blue-50 text-blue-700 border-blue-200",
            unpaid: "bg-orange-50 text-orange-700 border-orange-200",
            overdue: "bg-red-50 text-red-700 border-red-200",
            cancelled: "bg-gray-50 text-gray-700 border-gray-200",
        }
        return <Badge variant="outline" className={`${styles[status] || styles.unpaid} capitalize font-semibold shadow-none border`}>{status}</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        Invoices Directory
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 font-medium max-w-md">Manage student financial obligations and billing cycles.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={exportToCSV} className="flex-1 sm:flex-none font-semibold gap-2 border-gray-200 h-10 md:h-11 shadow-sm">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                    <Link href="/dashboard/accounting/invoices/new" className="flex-1 sm:flex-none">
                        <Button className="w-full font-semibold shadow-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 h-10 md:h-11">
                            <Plus className="h-4 w-4" /> <span className="hidden xs:inline">Create Invoice</span><span className="xs:hidden">New</span>
                        </Button>
                    </Link>
                </div>
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
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                        </select>
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
                                <TableHead className="w-[80px] text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground font-bold animate-pulse">
                                        REFRESHING LEDGER...
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
                                    <TableRow key={inv.id} className="hover:bg-gray-50 cursor-default group transition-colors">
                                        <TableCell className="font-mono text-sm font-bold text-blue-600">
                                            {inv.invoice_no}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{inv.students?.full_name}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Grade {inv.students?.classes?.name || "N/A"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-gray-500">
                                            {format(new Date(inv.date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-gray-900">
                                            ${inv.total_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-red-600">
                                            ${inv.balance_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {statusBadge(inv.status)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-200">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl overflow-hidden shadow-xl border-gray-100">
                                                    <Link href={`/dashboard/accounting/invoices/${inv.id}`}>
                                                        <DropdownMenuItem className="gap-2 font-bold cursor-pointer">
                                                            <FileText className="w-4 h-4 text-blue-500" /> View Details
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem
                                                        className="gap-2 font-bold cursor-pointer"
                                                        onClick={() => handleEditClick(inv)}
                                                    >
                                                        <Edit2 className="w-4 h-4 text-emerald-500" /> Quick Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 font-bold cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                                                        onClick={() => {
                                                            setSelectedInvoice(inv)
                                                            setIsDeleteDialogOpen(true)
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-2xl">Delete Invoice?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-gray-500">
                            This will permanently remove the invoice <span className="text-red-600 font-bold">{selectedInvoice?.invoice_no}</span> and all its items. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold" disabled={isActionLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-6"
                            onClick={handleDelete}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? "Deleting..." : "Confirm Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Quick Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="rounded-3xl max-w-md p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Edit Invoice Metadata</DialogTitle>
                        <DialogDescription className="font-medium text-gray-500">
                            Update the basic details for invoice {selectedInvoice?.invoice_no}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Due Date</Label>
                            <Input
                                type="date"
                                value={editData.due_date}
                                onChange={e => setEditData({ ...editData, due_date: e.target.value })}
                                className="h-12 rounded-xl bg-gray-50 border-transparent focus:ring-2 focus:ring-blue-500/20 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Internal Notes</Label>
                            <Textarea
                                value={editData.notes}
                                onChange={e => setEditData({ ...editData, notes: e.target.value })}
                                placeholder="Add notes for this invoice..."
                                className="min-h-[120px] rounded-xl bg-gray-50 border-transparent focus:ring-2 focus:ring-blue-500/20 font-medium"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            className="rounded-xl font-bold"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isActionLoading}
                        >
                            Discard
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black px-8 shadow-lg shadow-blue-200"
                            onClick={handleUpdate}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? "Saving Changes..." : "Update Invoice"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

