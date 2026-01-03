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
import { Plus, Search, ChevronRight, Activity, ShieldCheck, Edit2, Trash2, AlertCircle } from "lucide-react"
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
                toast.success("Account updated successfully")
            } else {
                await createAccount(payload)
                toast.success("Account created successfully")
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
            toast.success("Account deleted successfully")
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
        asset: "bg-blue-50 text-blue-700 border-blue-100",
        liability: "bg-red-50 text-red-700 border-red-100",
        equity: "bg-purple-50 text-purple-700 border-purple-100",
        income: "bg-emerald-50 text-emerald-700 border-emerald-100",
        expense: "bg-orange-50 text-orange-700 border-orange-100",
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Chart of Accounts</h2>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-0.5">Financial Control & Ledger Mapping</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) resetForm()
                    }}>
                        <DialogTrigger asChild>
                            <Button className="font-bold gap-2 shadow-lg shadow-primary/20 bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4" /> Add GL Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>{selectedAccount ? "Edit Account" : "Add New GL Account"}</DialogTitle>
                                    <DialogDescription>
                                        Configure a new account in the Chart of Accounts.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="code" className="text-xs font-bold uppercase text-gray-500">Account Code</Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="e.g. 1001"
                                            required
                                            className="rounded-xl border-gray-200"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-xs font-bold uppercase text-gray-500">Account Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Cash on Hand"
                                            required
                                            className="rounded-xl border-gray-200"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="type" className="text-xs font-bold uppercase text-gray-500">Type</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                                            >
                                                <SelectTrigger className="rounded-xl border-gray-200 font-medium">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="asset">Asset</SelectItem>
                                                    <SelectItem value="liability">Liability</SelectItem>
                                                    <SelectItem value="equity">Equity</SelectItem>
                                                    <SelectItem value="income">Income</SelectItem>
                                                    <SelectItem value="expense">Expense</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="parent" className="text-xs font-bold uppercase text-gray-500">Parent Account</Label>
                                            <Select
                                                value={formData.parent_id}
                                                onValueChange={(val) => setFormData({ ...formData, parent_id: val })}
                                            >
                                                <SelectTrigger className="rounded-xl border-gray-200 font-medium">
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="null">None (Root)</SelectItem>
                                                    {accounts.filter(a => !a.parent_id && a.id !== selectedAccount?.id).map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description" className="text-xs font-bold uppercase text-gray-500">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description of this account purpose..."
                                            className="rounded-xl border-gray-200 min-h-[80px]"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsDialogOpen(false)}
                                        className="font-bold text-gray-500"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                                    >
                                        {isSubmitting ? "Saving..." : selectedAccount ? "Update Account" : "Create Account"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(summary).map(([type, count]: [any, any]) => (
                    <Card key={type} className="border-none shadow-sm overflow-hidden group">
                        <div className={`h-1 w-full ${typeColors[type]?.split(' ')[0]}`} />
                        <CardContent className="pt-4">
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{type}s</div>
                            <div className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors">{count}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-700">Financial GL Map</CardTitle>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Filter by code or name..."
                                className="pl-9 w-[300px] border-slate-200 rounded-xl font-medium bg-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-60 flex flex-col items-center justify-center text-muted-foreground font-bold gap-2">
                            <Activity className="w-8 h-8 animate-spin text-primary" />
                            Initializing Ledger Schema...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/20">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="font-bold text-slate-400 pl-6 w-[120px]">Code</TableHead>
                                        <TableHead className="font-bold text-slate-400">Account Name</TableHead>
                                        <TableHead className="font-bold text-slate-400">Classification</TableHead>
                                        <TableHead className="font-bold text-slate-400 hidden lg:table-cell">Description</TableHead>
                                        <TableHead className="font-bold text-slate-400 text-center">Status</TableHead>
                                        <TableHead className="font-bold text-slate-400 text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAccounts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-medium">
                                                No accounts found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAccounts.map((acc) => (
                                            <TableRow key={acc.id} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="pl-6 font-mono text-xs font-black text-slate-500">
                                                    {acc.code}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {acc.parent_id && <ChevronRight className="w-3 h-3 text-slate-300 ml-4" />}
                                                        <span className={`font-bold transition-colors ${acc.parent_id ? "text-slate-500 text-sm" : "text-slate-900"}`}>
                                                            {acc.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${typeColors[acc.type] || ""} border-none font-black text-[9px] uppercase tracking-widest px-2 py-1 shadow-none rounded-full`}>
                                                        {acc.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-400 text-xs italic max-w-[200px] truncate hidden lg:table-cell">
                                                    {acc.description || "—"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {acc.is_active ? (
                                                        <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-100">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            ACTIVE
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full text-[10px] font-black border border-slate-100">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                            DISABLED
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => handleEdit(acc)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => {
                                                                setAccountToDelete(acc)
                                                                setIsDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            Are you sure you want to delete <span className="font-bold text-slate-900">"{accountToDelete?.name}"</span>?
                            This action cannot be undone and will fail if the account has existing transactions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl font-bold border-slate-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-red-200"
                        >
                            {isSubmitting ? "Deleting..." : "Delete Account"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
