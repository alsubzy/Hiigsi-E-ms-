"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Loader2, School } from "lucide-react"
import { useState, useEffect } from "react"
import { getPaymentDetails } from "@/app/actions/accounting"
import { format } from "date-fns"

interface ReceiptDialogProps {
    paymentId: string
    trigger?: React.ReactNode
}

export function ReceiptDialog({ paymentId, trigger }: ReceiptDialogProps) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (open && paymentId) {
            fetchData()
        }
    }, [open, paymentId])

    async function fetchData() {
        setLoading(true)
        try {
            const details = await getPaymentDetails(paymentId)
            setData(details)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Printer className="w-4 h-4" /> Print
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[800px] bg-white sm:rounded-none p-0 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-gray-500 mt-2">Loading receipt...</p>
                    </div>
                ) : !data ? (
                    <div className="p-8 text-center text-red-500">Failed to load receipt data.</div>
                ) : (
                    <div className="flex flex-col h-full bg-white text-slate-900 print:text-black">
                        {/* Toolbar - Hidden when printing */}
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50 print:hidden">
                            <h3 className="font-semibold text-gray-900">Payment Receipt</h3>
                            <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                <Printer className="w-4 h-4" /> Print Receipt
                            </Button>
                        </div>

                        {/* Receipt Content */}
                        <div className="p-8 print:p-0 print:m-0" id="receipt-area">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8 border-b pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                        {/* Placeholder Logo */}
                                        <School className="w-8 h-8 text-slate-800" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">HIIGSI S.M.S</h1>
                                        <p className="text-sm text-slate-500">Excellence in Education</p>
                                        <p className="text-sm text-slate-500">Mogadishu, Somalia</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-1">Receipt No</p>
                                    <p className="text-xl font-mono font-bold text-slate-900">{data.payment_no}</p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Detailed To</h4>
                                    <p className="text-lg font-bold text-slate-900">{data.students?.first_name} {data.students?.last_name}</p>
                                    <p className="text-slate-600 text-sm">ID: {data.students?.student_id || data.student_id?.split('-')[0]}</p>
                                    <p className="text-slate-600 text-sm">Class: {data.students?.class_name}</p>
                                </div>
                                <div className="text-right">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Payment Details</h4>
                                    <p className="text-sm text-slate-600"><span className="font-semibold">Date:</span> {format(new Date(data.payment_date), "MMMM do, yyyy")}</p>
                                    <p className="text-sm text-slate-600"><span className="font-semibold">Method:</span> <span className="capitalize">{data.payment_method}</span></p>
                                    <p className="text-sm text-slate-600"><span className="font-semibold">Collected By:</span> {data.users_collected?.full_name || "System"}</p>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="mb-8">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left font-semibold text-slate-600">Description</th>
                                            <th className="py-3 px-4 text-right font-semibold text-slate-600">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 border-b border-slate-100">
                                        {/* Assuming invoice items relate to this payment.
                        Since we pay mostly lump sum against invoice, we show "Payment against Invoice X" or list items if we had specific allocation.
                        For simplicity, we show the main fee or description.
                    */}
                                        <tr>
                                            <td className="py-4 px-4 font-medium text-slate-800">
                                                Payment for Invoice #{data.invoices?.invoice_no}
                                                {data.notes && <div className="text-xs text-slate-500 mt-1">{data.notes}</div>}
                                            </td>
                                            <td className="py-4 px-4 text-right font-bold text-slate-900">${Number(data.amount).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td className="py-4 px-4 text-right font-bold text-slate-900">Total Paid</td>
                                            <td className="py-4 px-4 text-right font-black text-xl text-slate-900 border-t-2 border-slate-900">
                                                ${Number(data.amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="text-center pt-8 border-t border-slate-100">
                                <p className="text-slate-500 italic text-sm">Thank you for your payment!</p>
                                <p className="text-xs text-slate-300 mt-4 print:hidden">Generated by Hiigsi School Management System</p>
                            </div>
                        </div>

                        <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #receipt-area, #receipt-area * {
                  visibility: visible;
                }
                #receipt-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
                .dialog-close {
                    display: none;
                }
              }
            `}</style>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
