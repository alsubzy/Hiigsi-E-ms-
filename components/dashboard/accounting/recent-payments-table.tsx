"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import type { Payment } from "@/lib/types" // Assuming types exists or we infer
import { format } from "date-fns"
import { ReceiptDialog } from "./receipt-dialog"

interface RecentPaymentsTableProps {
    payments: any[]
}

export function RecentPaymentsTable({ payments }: RecentPaymentsTableProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-full">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Recent Payments</h2>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide pb-4 pl-2">Receipt No.</th>
                            <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide pb-4">Student</th>
                            <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide pb-4">Ref/Info</th>
                            <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide pb-4">Date</th>
                            <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide pb-4">Amount</th>
                            <th className="text-right font-semibold text-slate-500 text-xs uppercase tracking-wide pb-4 pr-2">Actions</th>
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
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {payment.invoices?.invoice_no}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                                                {format(new Date(payment.payment_date), "MMM do, yyyy")}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 font-bold text-slate-800 dark:text-white">
                                        ${Number(payment.amount).toLocaleString()}
                                    </td>
                                    <td className="py-4 pr-2 text-right">
                                        <ReceiptDialog paymentId={payment.id} />
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
