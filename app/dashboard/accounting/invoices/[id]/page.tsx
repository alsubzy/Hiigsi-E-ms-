"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Printer, Download, School, Mail, Phone, Globe, Receipt, User, Calendar, CheckCircle2, AlertCircle, Building2, ExternalLink, FileText, Share2, DollarSign } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function InvoiceDetailPage() {
    const { id } = useParams()
    const [invoice, setInvoice] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchInvoice()
    }, [id])

    async function fetchInvoice() {
        const supabase = createClient()
        try {
            const { data, error } = await supabase
                .from("invoices")
                .select(`
          *,
          students (
            first_name,
            last_name,
            student_id,
            sections (
              classes (
                name
              )
            ),
            id
          ),
          invoice_items (
            *,
            student_fees (
              fee_structures (
                fee_categories (
                  name
                )
              )
            )
          )
        `)
                .eq("id", id)
                .single()

            if (error) throw error

            // Format student name
            const formattedData = {
                ...data,
                students: data.students ? {
                    ...data.students,
                    full_name: `${data.students.first_name} ${data.students.last_name}`,
                    classes: data.students.sections?.classes
                } : null
            }

            setInvoice(formattedData)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
            <div className="relative">
                <Receipt className="w-12 h-12 animate-pulse text-blue-500" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            </div>
            <div className="flex flex-col items-center">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Retrieving Transaction Record</span>
                <span className="text-[10px] font-medium text-zinc-400">Please wait while the bill is generated...</span>
            </div>
        </div>
    )

    if (!invoice) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500">
                <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Record Not Found</h2>
            <Link href="/dashboard/accounting/invoices">
                <Button variant="outline" className="rounded-xl font-bold gap-2">
                    <ArrowLeft size={16} /> Return to Directory
                </Button>
            </Link>
        </div>
    )

    const statusConfig: Record<string, { label: string, icon: any, color: string, bg: string }> = {
        paid: { label: "Fully Paid", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" },
        partial: { label: "Partial Payment", icon: Clock, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" },
        unpaid: { label: "Pending Payment", icon: AlertCircle, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800" },
        overdue: { label: "Payment Overdue", icon: AlertCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800" },
    }

    const currentStatus = statusConfig[invoice.status] || statusConfig.unpaid
    const StatusIcon = currentStatus.icon

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950/50 pb-20">
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                    <Link href="/dashboard/accounting/invoices">
                        <Button variant="ghost" className="h-12 px-6 rounded-2xl text-zinc-500 font-bold gap-2 hover:bg-white dark:hover:bg-zinc-900 transition-all shadow-sm">
                            <ArrowLeft size={18} /> Back to Directory
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold flex-1 sm:flex-none gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-sm" onClick={handlePrint}>
                            <Printer size={18} /> Print
                        </Button>
                        <Button className="h-12 px-6 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black text-xs uppercase tracking-wider flex-1 sm:flex-none gap-2 shadow-xl transition-all active:scale-95">
                            <Download size={18} /> Download JSON
                        </Button>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden print:shadow-none print:border print:border-zinc-200">
                        {/* Header Banner */}
                        <div className="bg-zinc-900 dark:bg-zinc-900 p-12 text-white flex flex-col md:flex-row justify-between gap-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

                            <div className="flex gap-6 items-center relative z-10">
                                <div className="h-20 w-20 bg-white/5 backdrop-blur-md rounded-[1.75rem] flex items-center justify-center border border-white/10 shadow-2xl">
                                    <School size={40} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black tracking-tighter">HIIGSI S.M.S</h2>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-white/20 text-white/60 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">Official Ledger</Badge>
                                        <div className="h-1 w-1 rounded-full bg-white/20" />
                                        <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest">ID: {invoice.invoice_no}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right flex flex-col justify-end relative z-10">
                                <div className="font-black text-[10px] uppercase tracking-[0.4em] text-white/40 mb-2">Institutional Invoice</div>
                                <h1 className="text-6xl font-black uppercase tracking-tighter leading-none mb-1 text-white">BILL</h1>
                                <div className="flex items-center gap-3 justify-end mt-4">
                                    <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-sm", currentStatus.bg)}>
                                        <StatusIcon size={16} className={currentStatus.color} />
                                        <span className={cn("font-black text-[11px] uppercase tracking-wider", currentStatus.color)}>
                                            {currentStatus.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-12 space-y-16">
                            {/* Entity Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
                                        <User size={14} className="text-blue-500" /> Billed To
                                    </div>
                                    <div className="pl-1">
                                        <div className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">{invoice.students?.full_name}</div>
                                        <div className="flex flex-col mt-3 space-y-1">
                                            <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                                                Grade {invoice.students?.classes?.name}
                                            </div>
                                            <div className="text-[11px] text-zinc-400 font-black uppercase tracking-widest">
                                                REG ID: {invoice.students?.student_id || "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
                                        <Calendar size={14} className="text-emerald-500" /> Chronology
                                    </div>
                                    <div className="space-y-3 pl-1">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold font-black uppercase tracking-wider">Issued</span>
                                            <span className="text-sm font-black text-zinc-900 dark:text-white">{format(new Date(invoice.date), "MMM dd, yyyy")}</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold font-black uppercase tracking-wider">Due Date</span>
                                            <span className="text-sm font-black text-rose-600 dark:text-rose-400">{format(new Date(invoice.due_date), "MMM dd, yyyy")}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
                                        <Building2 size={14} className="text-zinc-400" /> Institutional Info
                                    </div>
                                    <div className="space-y-2 pl-1">
                                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-blue-500 transition-colors">
                                            <Mail size={14} className="text-zinc-300" /> support@hiigsi.edu
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-blue-500 transition-colors">
                                            <Phone size={14} className="text-zinc-300" /> +252 61 XXX XXX
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-blue-500 transition-colors">
                                            <Globe size={14} className="text-zinc-300" /> www.hiigsi.edu
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Line Items */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3 font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
                                        <FileText size={14} className="text-zinc-400" /> Transaction Breakdown
                                    </div>
                                </div>
                                <div className="rounded-[2rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                                            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                                <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest pl-8 py-5">Specified Fee Descriptor</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest text-right py-5">Registry ID</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase text-[9px] tracking-widest text-right pr-8 py-5">Net Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoice.invoice_items?.map((item: any) => (
                                                <TableRow key={item.id} className="border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/30 transition-colors">
                                                    <TableCell className="pl-8 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="font-black text-zinc-900 dark:text-white text-base">{item.student_fees?.fee_structures?.fee_categories?.name}</div>
                                                            <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Educational Service Unit</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-6">
                                                        <span className="font-mono text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                                            {invoice.students?.student_id || "N/A"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8 py-6">
                                                        <div className="inline-flex items-center gap-1">
                                                            <DollarSign size={14} className="text-zinc-300" />
                                                            <span className="font-black text-xl text-zinc-900 dark:text-white tracking-tighter">
                                                                {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="flex flex-col md:flex-row justify-between items-end gap-12 pt-10">
                                <div className="w-full md:max-w-md space-y-6">
                                    <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-3 font-black text-zinc-400 text-[9px] uppercase tracking-[0.2em] mb-4">
                                            <Share2 size={12} /> Notes & Context
                                        </div>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed italic">
                                            {invoice.notes || "No internal administrative annotations recorded for this transaction."}
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full md:w-96 space-y-5">
                                    <div className="space-y-4 px-6">
                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-400">
                                            <span>Subtotal</span>
                                            <span className="text-zinc-900 dark:text-white">${Number(invoice.total_amount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-400">
                                            <span>Tax Adjustments</span>
                                            <span className="text-zinc-900 dark:text-white">$0.00</span>
                                        </div>
                                        {invoice.paid_amount > 0 && (
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-emerald-500">
                                                <span>Settled Amount</span>
                                                <span>-${Number(invoice.paid_amount).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                                    <div className="p-8 rounded-[2.5rem] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl shadow-zinc-900/20 dark:shadow-none space-y-2 transform lg:scale-105 transition-transform hover:scale-110 duration-500">
                                        <div className="flex items-center justify-between opacity-60">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Total Outstanding</span>
                                            <Receipt size={14} />
                                        </div>
                                        <div className="flex items-end justify-between gap-4">
                                            <div className="flex items-center">
                                                <DollarSign size={24} className="mb-2 opacity-40" />
                                                <span className="text-5xl font-black tracking-tighter">
                                                    {Number(invoice.balance_amount).toLocaleString()}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold font-mono opacity-40 mb-1">USD</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Footer */}
                            <div className="pt-24 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-20">
                                <div className="space-y-6">
                                    <div className="h-10 border-b-2 border-zinc-100 dark:border-zinc-800 w-64"></div>
                                    <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Institutional Registrar Authorization</div>
                                </div>
                                <div className="flex flex-col items-center md:items-end space-y-4">
                                    <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-2 rounded-full border border-emerald-100 dark:border-emerald-800 inline-flex items-center gap-2 uppercase tracking-[0.2em] shadow-sm">
                                        <CheckCircle2 size={12} /> Authentically Verified Record
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-zinc-300 dark:text-zinc-700 font-mono">Issued via Hiigsi Accounting Engine Revision 2.0</div>
                                        <div className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono mt-1 opacity-60">ID: {invoice.id} • {new Date().toISOString()}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="text-center py-10 print:hidden space-y-4">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
                        This digital document constitutes an authoritative financial obligation record. Discrepancies should be reported to the registrar office within 48 business hours.
                    </p>
                    <div className="flex justify-center gap-6 grayscale opacity-40">
                        <div className="h-1 w-1 rounded-full bg-zinc-300" />
                        <div className="h-1 w-1 rounded-full bg-zinc-300" />
                        <div className="h-1 w-1 rounded-full bg-zinc-300" />
                    </div>
                </div>

                <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
          }
          /* Hide non-printable elements */
          nav, aside, header, .print\:hidden, button {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Fix layout for print */
          .max-w-5xl {
            max-width: none !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .shadow-2xl, .shadow-xl, .shadow-sm {
            box-shadow: none !important;
          }
          .border-none {
            border: 1px solid #e2e8f0 !important;
          }
          .rounded-[3rem], .rounded-[2.5rem], .rounded-2xl {
            border-radius: 0 !important;
          }
          /* Grid adjustments for print */
          .grid {
            display: grid !important;
          }
        }
      `}</style>
            </div>
        </div>
    )
}

function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
