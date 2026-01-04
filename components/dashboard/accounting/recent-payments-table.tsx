"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import type { Payment } from "@/lib/types" // Assuming types exists or we infer
import { format } from "date-fns"
import { ReceiptDialog } from "./receipt-dialog"
import { reversePayment } from "@/app/actions/accounting"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2, RotateCcw } from "lucide-react"

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
                description: "The transaction has been voided and invoice balance restored."
            })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setReversingId(null)
        }
    }

    const getMethodBadge = (method: string) => {
        const styles: any = {
            cash: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            bank_transfer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            mobile_money: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        }
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles[method] || "bg-slate-100 text-slate-600"}`}>
                {method.replace("_", " ")}
            </span>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-full">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-4 md:mb-6">Recent Payments</h2>

            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full min-w-[600px] md:min-w-0">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left font-bold text-slate-400 text-[10px] uppercase tracking-widest pb-3 pl-2">Receipt No.</th>
                            <th className="text-left font-bold text-slate-400 text-[10px] uppercase tracking-widest pb-3">Student</th>
                            <th className="text-left font-bold text-slate-400 text-[10px] uppercase tracking-widest pb-3">Method & Ref</th>
                            <th className="text-left font-bold text-slate-400 text-[10px] uppercase tracking-widest pb-3">Date</th>
                            <th className="text-left font-bold text-slate-400 text-[10px] uppercase tracking-widest pb-3">Amount</th>
                            <th className="text-right font-bold text-slate-400 text-[10px] uppercase tracking-widest pb-3 pr-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {payments && payments.length > 0 ? (
                            payments.map((payment) => (
                                <tr key={payment.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 pl-2">
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                                            {payment.payment_no}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                {payment.students?.first_name} {payment.students?.last_name}
                                            </span>
                                            <span className="text-xs text-slate-400">ID: {payment.students?.student_id || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-col items-start gap-1">
                                            {getMethodBadge(payment.payment_method)}
                                            <span className="text-xs text-slate-500 font-mono">
                                                {payment.invoices?.invoice_no}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                                            {format(new Date(payment.payment_date), "MMM do, yyyy")}
                                        </span>
                                    </td>
                                    <td className="py-4 font-bold text-slate-800 dark:text-white">
                                        ${Number(payment.amount).toLocaleString()}
                                    </td>
                                    <td className="py-4 pr-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <ReceiptDialog paymentId={payment.id} />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-full"
                                                onClick={() => handleReverse(payment.id)}
                                                disabled={!!reversingId}
                                            >
                                                {reversingId === payment.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                                    No recent payments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
