"use client"

import { useState, useEffect } from "react"
import { getAccounts, recordExpense } from "@/app/actions/accounting"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import { Plus, Receipt, Wallet, Search, Filter } from "lucide-react"

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        account_id: "",
        amount: "",
        vendor: "",
        payment_method: "cash",
        description: "",
        date: format(new Date(), "yyyy-MM-dd")
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const supabase = createClient()
        try {
            const [accs, { data: exps }] = await Promise.all([
                getAccounts(),
                supabase.from("expenses").select("*, accounts(name)").order("date", { ascending: false })
            ])

            setAccounts(accs.filter((a: any) => a.type === "expense"))
            setExpenses(exps || [])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await recordExpense({
                ...formData,
                amount: Number(formData.amount)
            })
            toast.success("Expense recorded successfully")
            setIsDialogOpen(false)
            fetchData()
            setFormData({
                account_id: "",
                amount: "",
                vendor: "",
                payment_method: "cash",
                description: "",
                date: format(new Date(), "yyyy-MM-dd")
            })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">Expense Tracking</h2>
                    <p className="text-sm text-gray-500 font-medium whitespace-nowrap">Record and monitor school outflows and vendor payments</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold gap-2">
                            <Plus className="w-4 h-4" /> Record New Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="font-black text-2xl">Record Expense</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        required
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Expense Category</Label>
                                <Select required value={formData.account_id} onValueChange={val => setFormData({ ...formData, account_id: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select account..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Vendor / Payee</Label>
                                <Input
                                    placeholder="Company Name, Person, etc."
                                    value={formData.vendor}
                                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={formData.payment_method} onValueChange={val => setFormData({ ...formData, payment_method: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank">Bank Transfer</SelectItem>
                                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    placeholder="Details of expense"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full font-bold h-12" disabled={isSubmitting}>
                                {isSubmitting ? "Recording..." : "Post to Ledger"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-red-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-red-600 uppercase tracking-wider">Total Expenses (Current Month)</CardTitle>
                        <Receipt className="w-5 h-5 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-red-900">
                            ${expenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-red-600/60 font-medium">+12.5% from last month</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-black text-xl">Recent Expenses</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Search vendor or desc..." className="pl-9 w-[300px]" />
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
                                    <TableHead className="font-bold text-gray-400">Expense ID</TableHead>
                                    <TableHead className="font-bold text-gray-400">Category</TableHead>
                                    <TableHead className="font-bold text-gray-400">Vendor</TableHead>
                                    <TableHead className="font-bold text-gray-400">Payment Method</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-right">Amount</TableHead>
                                    <TableHead className="font-bold text-gray-400 text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((exp) => (
                                    <TableRow key={exp.id} className="border-gray-50 group hover:bg-gray-50/50">
                                        <TableCell className="font-medium">{format(new Date(exp.date), "MMM dd, yyyy")}</TableCell>
                                        <TableCell className="font-bold text-xs font-mono text-muted-foreground">{exp.expense_no}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-tighter">
                                                {exp.accounts?.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-700">{exp.vendor || "N/A"}</TableCell>
                                        <TableCell className="capitalize text-muted-foreground font-medium">{exp.payment_method}</TableCell>
                                        <TableCell className="text-right font-black text-red-600">
                                            -${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none font-bold">
                                                {exp.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {expenses.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-40 text-center text-muted-foreground font-bold">
                                            No expense records found.
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
