"use client"

import { useState, useEffect } from "react"
import { getAccounts, recordOtherIncome } from "@/app/actions/accounting"
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
import { Plus, TrendingUp, Search, DollarSign } from "lucide-react"

export default function OtherIncomePage() {
    const [incomes, setIncomes] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const [formData, setFormData] = useState({
        account_id: "",
        amount: "",
        source: "",
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
            const [accs, { data: incs }] = await Promise.all([
                getAccounts(),
                supabase.from("other_incomes").select("*, accounts(name)").order("date", { ascending: false })
            ])

            setAccounts(accs.filter((a: any) => a.type === "income"))
            setIncomes(incs || [])
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
            await recordOtherIncome({
                ...formData,
                amount: Number(formData.amount)
            })
            toast.success("Income recorded successfully")
            setIsDialogOpen(false)
            fetchData()
            setFormData({
                account_id: "",
                amount: "",
                source: "",
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
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1E293B]">Other Income</h1>
                    <p className="text-muted-foreground whitespace-nowrap">Manage non-student revenue like donations, registrations, and grants</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold gap-2 bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4" /> Record New Income
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="font-black text-2xl">Record Income</DialogTitle>
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
                                <Label>Income Category</Label>
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
                                <Label>Source / Payer</Label>
                                <Input
                                    placeholder="Donor name, Government body, etc."
                                    required
                                    value={formData.source}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
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
                                    placeholder="Details of income"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full font-bold h-12 bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                                {isSubmitting ? "Recording..." : "Post to Ledger"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-green-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold text-green-600 uppercase tracking-wider">Total Other Income</CardTitle>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-green-900">
                            ${incomes.reduce((sum, inc) => sum + Number(inc.amount), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="font-bold text-gray-400">Date</TableHead>
                                <TableHead className="font-bold text-gray-400">Income ID</TableHead>
                                <TableHead className="font-bold text-gray-400">Category</TableHead>
                                <TableHead className="font-bold text-gray-400">Source</TableHead>
                                <TableHead className="font-bold text-gray-400 text-right">Amount</TableHead>
                                <TableHead className="font-bold text-gray-400 text-center">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incomes.map((inc) => (
                                <TableRow key={inc.id} className="border-gray-50 group hover:bg-gray-50/50">
                                    <TableCell className="font-medium">{format(new Date(inc.date), "MMM dd, yyyy")}</TableCell>
                                    <TableCell className="font-bold text-xs font-mono text-muted-foreground">{inc.income_no}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-tighter bg-green-50 text-green-700 border-green-100">
                                            {inc.accounts?.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-700">{inc.source}</TableCell>
                                    <TableCell className="text-right font-black text-green-600">
                                        +${Number(inc.amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center text-xs text-muted-foreground italic">
                                        {inc.description}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {incomes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-bold">
                                        No income records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
