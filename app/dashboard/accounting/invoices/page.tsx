"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Filter, Plus, FileText, Download, MoreVertical, Edit2, Trash2, Calendar, ClipboardList, ArrowRight, Wallet, History, AlertCircle, Receipt, User, DollarSign } from "lucide-react"
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
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
                .select("*, students(first_name, last_name, student_id, sections(classes(name)))")
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
            toast.success("Invoice deleted successfully", {
                className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
            })
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
            toast.success("Invoice updated successfully", {
                className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
            })
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
            paid: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
            partial: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800",
            unpaid: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800",
            overdue: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800",
            cancelled: "bg-zinc-50 text-zinc-600 dark:bg-zinc-900/20 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800",
        }
        return (
            <Badge variant="outline" className={cn(
                "capitalize font-black text-[9px] tracking-widest px-2.5 py-0.5 shadow-none border rounded-full",
                styles[status] || styles.unpaid
            )}>
                {status}
            </Badge>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Receipt size={20} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Billing Directory</h2>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Authoritative student financial obligations and transactional audit logs.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={exportToCSV} className="h-12 px-6 rounded-2xl border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold flex-1 sm:flex-none gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
                        <Download size={18} /> Export CSV
                    </Button>
                    <Link href="/dashboard/accounting/invoices/new" className="flex-1 sm:flex-none">
                        <Button className="w-full h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                            <Plus size={18} /> New Invoice
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                            <div className="relative group w-full lg:max-w-md">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Filter by ID, name or reference..."
                                    className="h-12 pl-12 pr-4 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                {["all", "unpaid", "partial", "paid", "overdue"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                                            statusFilter === status
                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-80 flex flex-col items-center justify-center text-zinc-400 font-bold gap-4"
                            >
                                <div className="relative">
                                    <History className="w-12 h-12 animate-pulse text-blue-500" />
                                    <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Analyzing Ledger History</span>
                                    <span className="text-[10px] font-medium text-zinc-400">Loading student financial records...</span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="overflow-x-auto h-full scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                <Table className="min-w-[1000px]">
                                    <TableHeader className="bg-zinc-50/20 dark:bg-zinc-900/20">
                                        <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-8 w-[160px]">Invoice Ref</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4">Student Identity</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4 text-right">Issuance Date</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4 text-right">Gross Total</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4 text-right">Outstanding</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4 text-center">Settlement</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-8 text-right">Management</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInvoices.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-60 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                                                            <Receipt size={32} />
                                                        </div>
                                                        <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">No historical billing detected</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredInvoices.map((inv, index) => (
                                                <motion.tr
                                                    key={inv.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="border-zinc-50 dark:border-zinc-900 group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                                >
                                                    <TableCell className="py-5 px-8">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-black text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono tracking-tighter shadow-sm w-fit group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                                                            {inv.invoice_no}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                                                                <User size={16} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight leading-none">
                                                                    {inv.students?.full_name}
                                                                </span>
                                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                                                                    REG: {inv.students?.student_id || "N/A"} • Grade {inv.students?.classes?.name || "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                                {format(new Date(inv.date), "MMM dd, yyyy")}
                                                            </span>
                                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tight mt-0.5">DUE: {format(new Date(inv.due_date), "MMM dd, yyyy")}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <DollarSign size={12} className="text-zinc-300" />
                                                            <span className="font-black text-sm text-zinc-900 dark:text-white">
                                                                {Number(inv.total_amount).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <DollarSign size={12} className="text-rose-300" />
                                                            <span className={cn(
                                                                "font-black text-base tracking-tight",
                                                                inv.balance_amount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                                            )}>
                                                                {Number(inv.balance_amount).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4 text-center">
                                                        {statusBadge(inv.status)}
                                                    </TableCell>
                                                    <TableCell className="py-5 px-8 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-10 w-10 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                                                                        <MoreVertical size={18} />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2 bg-white dark:bg-zinc-900">
                                                                    <Link href={`/dashboard/accounting/invoices/${inv.id}`}>
                                                                        <DropdownMenuItem className="h-11 rounded-xl gap-3 font-black text-[11px] uppercase tracking-wider cursor-pointer text-zinc-600 dark:text-zinc-300 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400">
                                                                            <FileText size={16} /> View Billing Details
                                                                        </DropdownMenuItem>
                                                                    </Link>
                                                                    <DropdownMenuItem
                                                                        className="h-11 rounded-xl gap-3 font-black text-[11px] uppercase tracking-wider cursor-pointer text-zinc-600 dark:text-zinc-300 focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:text-emerald-600 dark:focus:text-emerald-400"
                                                                        onClick={() => handleEditClick(inv)}
                                                                    >
                                                                        <Edit2 size={16} /> Quick Meta Update
                                                                    </DropdownMenuItem>
                                                                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1 mx-2" />
                                                                    <DropdownMenuItem
                                                                        className="h-11 rounded-xl gap-3 font-black text-[11px] uppercase tracking-wider cursor-pointer text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20 focus:text-rose-700 dark:focus:text-rose-400"
                                                                        onClick={() => {
                                                                            setSelectedInvoice(inv)
                                                                            setIsDeleteDialogOpen(true)
                                                                        }}
                                                                    >
                                                                        <Trash2 size={16} /> Purge Record
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </motion.tr>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md">
                    <AlertDialogHeader className="mb-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-zinc-900 dark:text-white text-center">
                            Purge Billing Record?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-center">
                            Critical: You are about to permanently delete invoice <span className="font-black text-rose-600">{selectedInvoice?.invoice_no}</span>. This will revert all associated balances.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-3">
                        <AlertDialogAction
                            className="h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl shadow-rose-500/20 transition-all active:scale-95"
                            onClick={handleDelete}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? "Processing..." : "Confirm Deletion"}
                        </AlertDialogAction>
                        <AlertDialogCancel className="h-14 rounded-2xl font-bold border-zinc-200 text-zinc-500 hover:bg-zinc-50" disabled={isActionLoading}>Abort Transaction</AlertDialogCancel>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-md">
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-8 border-b border-zinc-100 dark:border-zinc-800">
                        <DialogTitle className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Basic Meta Update</DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium font-mono text-xs">
                            MODIFYING RECORD: {selectedInvoice?.invoice_no}
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Payment Grace Period (Due Date)</Label>
                            <Input
                                type="date"
                                value={editData.due_date}
                                onChange={e => setEditData({ ...editData, due_date: e.target.value })}
                                className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Internal Ledger Annotations</Label>
                            <Textarea
                                value={editData.notes}
                                onChange={e => setEditData({ ...editData, notes: e.target.value })}
                                placeholder="Add administrative context..."
                                className="min-h-[140px] rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-medium resize-none"
                            />
                        </div>
                    </div>

                    <div className="p-8 pt-0 flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 h-12 rounded-xl font-bold text-zinc-400 hover:text-zinc-600"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isActionLoading}
                        >
                            Discard
                        </Button>
                        <Button
                            className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider shadow-lg shadow-blue-500/20"
                            onClick={handleUpdate}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? "Synchronizing..." : "Update Transaction"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

