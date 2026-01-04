"use client"

import { Button } from "@/components/ui/button"
import { Printer, RotateCcw, Loader2, Receipt, User, Calendar, DollarSign, ArrowRight } from "lucide-react"
import type { Payment } from "@/lib/types"
import { format } from "date-fns"
import { ReceiptDialog } from "./receipt-dialog"
import { reversePayment } from "@/app/actions/accounting"
import { toast } from "sonner"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RecentPaymentsTableProps {
    payments: any[]
}

export function RecentPaymentsTable({ payments }: RecentPaymentsTableProps) {
    const [reversingId, setReversingId] = useState<string | null>(null)

    async function handleReverse(id: string) {
        if (!confirm("Are you sure you want to reverse this payment? This will revert the invoice balance and cannot be undone.")) return

        setReversingId(id)
        try {
            await reversePayment(id, "User requested reversal")
            toast.success("Payment Reversed", {
                description: "The transaction has been voided and invoice balance restored.",
                className: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
            })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setReversingId(null)
        }
    }

    const getMethodBadge = (method: string) => {
        const styles: any = {
            cash: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
            bank_transfer: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800",
            mobile_money: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800"
        }
        return (
            <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                styles[method] || "bg-zinc-100 text-zinc-600 border-zinc-200"
            )}>
                {method.replace("_", " ")}
            </span>
        )
    }

    return (
        <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden flex flex-col h-full">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Receipt size={20} />
                        </div>
                        <CardTitle className="text-xl font-black text-zinc-900 dark:text-white">Recent Transactions</CardTitle>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Monitoring the latest inbound fee settlements.</p>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="overflow-x-auto h-full scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <th className="text-left font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-8">Reference</th>
                                <th className="text-left font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4">Student Entity</th>
                                <th className="text-left font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4">Settlement</th>
                                <th className="text-left font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4">Execution Date</th>
                                <th className="text-left font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-4">Net Amount</th>
                                <th className="text-right font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] py-5 px-8">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                            <AnimatePresence mode="popLayout">
                                {payments && payments.length > 0 ? (
                                    payments.map((payment, index) => (
                                        <motion.tr
                                            key={payment.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                        >
                                            <td className="py-5 px-8">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-zinc-400 mb-1">RCT-ID</span>
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-black text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono tracking-tighter shadow-sm w-fit">
                                                        {payment.payment_no}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">
                                                            {payment.students?.first_name} {payment.students?.last_name}
                                                        </span>
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">STUDENT REG: {payment.students?.student_id || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    {getMethodBadge(payment.payment_method)}
                                                    <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                                                        <Receipt size={12} />
                                                        <span className="text-[11px] font-bold font-mono">
                                                            {payment.invoices?.invoice_no}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                    <Calendar size={14} className="text-zinc-400" />
                                                    <span className="font-bold text-xs">
                                                        {format(new Date(payment.payment_date), "MMM do, yyyy")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-1">
                                                    <DollarSign size={14} className="text-zinc-400" />
                                                    <span className="font-black text-lg text-zinc-900 dark:text-white tracking-tight">
                                                        {Number(payment.amount).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ReceiptDialog paymentId={payment.id} />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                        onClick={() => handleReverse(payment.id)}
                                                        disabled={!!reversingId}
                                                    >
                                                        {reversingId === payment.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                        ) : (
                                                            <RotateCcw className="w-5 h-5" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                                                    <ArrowRight size={32} />
                                                </div>
                                                <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">No historical transactions detected</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
