"use client"

import { useState, useEffect } from "react"
import { getAccounts, createAccount, updateAccount, deleteAccount } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Activity, Edit2, Trash2, AlertCircle, LayoutGrid, DollarSign, Tag, Calendar, GraduationCap, ArrowUpRight, CheckCircle2, Info, Receipt, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { toast } from "sonner"
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
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function COAPage() {
    const [accounts, setAccounts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<any>(null)
    const [accountToDelete, setAccountToDelete] = useState<any>(null)

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        type: "expense" as any,
        parent_id: "null",
        description: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const data = await getAccounts()
            setAccounts(data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            type: "expense",
            parent_id: "null",
            description: ""
        })
        setSelectedAccount(null)
    }

    const handleEdit = (account: any) => {
        setSelectedAccount(account)
        setFormData({
            name: account.name,
            code: account.code,
            type: account.type,
            parent_id: account.parent_id || "null",
            description: account.description || ""
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const payload = {
            ...formData,
            parent_id: formData.parent_id === "null" ? null : formData.parent_id
        }

        try {
            if (selectedAccount) {
                await updateAccount(selectedAccount.id, payload)
                toast.success("Account updated successfully", {
                    className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                })
            } else {
                await createAccount(payload)
                toast.success("Account created successfully", {
                    className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                })
            }
            setIsDialogOpen(false)
            fetchData()
            resetForm()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!accountToDelete) return
        setIsSubmitting(true)
        try {
            await deleteAccount(accountToDelete.id)
            toast.success("Account deleted successfully", {
                className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
            })
            setIsDeleteDialogOpen(false)
            fetchData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
            setAccountToDelete(null)
        }
    }

    const typeColors: Record<string, string> = {
        asset: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800",
        liability: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-800",
        equity: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 border-violet-100 dark:border-violet-800",
        income: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
        expense: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800",
    }

    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.includes(searchTerm)
    )

    const summary = accounts.reduce((acc: any, curr: any) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1
        return acc
    }, {})

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <TableProperties size={20} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Chart of Accounts</h2>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Configure and manage your organization&apos;s financial ledger structure.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) resetForm()
                    }}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                                <Plus size={18} /> Add GL Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-zinc-50 dark:bg-zinc-900 p-8 border-b border-zinc-100 dark:border-zinc-800">
                                    <DialogTitle className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{selectedAccount ? "Update Account" : "Add GL Account"}</DialogTitle>
                                    <DialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium">
                                        Configure a new entry in the organizational ledger schema.
                                    </DialogDescription>
                                </div>
                                <div className="p-8 space-y-5 bg-white dark:bg-zinc-950">
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Account Code</Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="e.g. 1001"
                                            required
                                            className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Account Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Cash on Hand"
                                            required
                                            className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Type</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="asset">Asset</SelectItem>
                                                    <SelectItem value="liability">Liability</SelectItem>
                                                    <SelectItem value="equity">Equity</SelectItem>
                                                    <SelectItem value="income">Income</SelectItem>
                                                    <SelectItem value="expense">Expense</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="parent" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Hierarchy</Label>
                                            <Select
                                                value={formData.parent_id}
                                                onValueChange={(val) => setFormData({ ...formData, parent_id: val })}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 font-bold">
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="null">None (Root)</SelectItem>
                                                    {accounts.filter(a => !a.parent_id && a.id !== selectedAccount?.id).map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Meta Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Optional accounting context..."
                                            className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 min-h-[100px] font-medium resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="p-8 pt-0 flex gap-3 bg-white dark:bg-zinc-950">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsDialogOpen(false)}
                                        className="flex-1 h-12 rounded-xl font-bold text-zinc-400 hover:text-zinc-600"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider shadow-lg shadow-blue-500/20"
                                    >
                                        {isSubmitting ? "Processing..." : selectedAccount ? "Update Ledger" : "Create Account"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['asset', 'liability', 'equity', 'income', 'expense'].map((type) => {
                    const count = summary[type] || 0
                    return (
                        <Card key={type} className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all">
                            <div className={cn("h-1.5 w-full", typeColors[type]?.split(' ')[0])} />
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", typeColors[type])}>
                                        <TrendingUp size={18} />
                                    </div>
                                    <ArrowUpRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                </div>
                                <div className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-1">{type} Accounts</div>
                                <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{count}</div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">General Ledger Map</CardTitle>
                                <p className="text-zinc-500 text-xs font-medium">Authoritative financial account hierarchy.</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative group w-full sm:w-[320px]">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Execute filter via code or name..."
                                    className="h-12 pl-12 pr-4 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shrink-0">
                                <Filter size={18} />
                            </Button>
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
                                    <Activity className="w-12 h-12 animate-pulse text-blue-500" />
                                    <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Synchronizing Ledger</span>
                                    <span className="text-[10px] font-medium text-zinc-400">Fetching schema from cloud database...</span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="overflow-x-auto h-full scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                                <Table className="min-w-[900px]">
                                    <TableHeader className="bg-zinc-50/20 dark:bg-zinc-900/20">
                                        <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-8 w-[150px]">Entity Code</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4">Account Label</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4 w-[160px]">Classification</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4 hidden lg:table-cell">Contextual Meta</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4 text-center w-[120px]">Current Status</TableHead>
                                            <TableHead className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-8 text-right w-[150px]">Management</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAccounts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-60 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                                                            <Activity size={32} />
                                                        </div>
                                                        <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">No ledger accounts detected</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredAccounts.map((acc, index) => (
                                                <motion.tr
                                                    key={acc.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="border-zinc-50 dark:border-zinc-900 group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                                >
                                                    <TableCell className="py-5 px-8">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-black text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono tracking-tighter shadow-sm w-fit">
                                                            {acc.code}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            {acc.parent_id && <ChevronRight className="w-3.5 h-3.5 text-zinc-300 ml-4 group-hover:translate-x-1 transition-transform" />}
                                                            <span className={cn(
                                                                "font-bold transition-colors",
                                                                acc.parent_id ? "text-zinc-500 text-sm" : "text-zinc-900 dark:text-zinc-100 text-base"
                                                            )}>
                                                                {acc.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4">
                                                        <Badge className={cn("border px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-none", typeColors[acc.type])}>
                                                            {acc.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4 text-zinc-400 text-xs italic max-w-[250px] truncate hidden lg:table-cell">
                                                        {acc.description || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-5 px-4 text-center">
                                                        {acc.is_active ? (
                                                            <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100 dark:border-emerald-800">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                                SYNCED
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1 rounded-full text-[10px] font-black border border-zinc-200 dark:border-zinc-800">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                                                OFFLINE
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-5 px-8 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                                                onClick={() => handleEdit(acc)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                                onClick={() => {
                                                                    setAccountToDelete(acc)
                                                                    setIsDeleteDialogOpen(true)
                                                                }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
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
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                    <AlertDialogHeader className="mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-zinc-900 dark:text-white text-center">
                            Irreversible Action
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-center">
                            Are you absolutely sure you want to delete <span className="font-black text-zinc-900 dark:text-zinc-100">"{accountToDelete?.name}"</span>?
                            This will permanently remove the ledger entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0">
                        <AlertDialogCancel className="w-full h-12 rounded-xl font-bold border-zinc-200 text-zinc-500">Abort Deletion</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                        >
                            {isSubmitting ? "Processing..." : "Confirm Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
