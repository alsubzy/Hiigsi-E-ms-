"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Printer, Download, School, Mail, Phone, Globe } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useParams } from "next/navigation"
import { toast } from "sonner"

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
            classes (
            name
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
            if (error) throw error

            // Format student name
            const formattedData = {
                ...data,
                students: data.students ? {
                    ...data.students,
                    full_name: `${data.students.first_name} ${data.students.last_name}`
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

    if (isLoading) return <div className="p-6 h-screen flex flex-col items-center justify-center text-muted-foreground font-black animate-pulse">GENERATING BILLING PREVIEW...</div>
    if (!invoice) return <div className="p-6 text-center font-bold">Invoice not found.</div>

    const statusColors: Record<string, string> = {
        paid: "bg-emerald-100 text-emerald-800",
        partial: "bg-blue-100 text-blue-800",
        unpaid: "bg-orange-100 text-orange-800",
        overdue: "bg-red-100 text-red-800",
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center print:hidden">
                <Link href="/dashboard/accounting/invoices">
                    <Button variant="ghost" className="font-bold gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to List
                    </Button>
                </Link>
                <div className="flex gap-2">
                    <Button variant="outline" className="font-bold gap-2" onClick={handlePrint}>
                        <Printer className="w-4 h-4" /> Print Invoice
                    </Button>
                    <Button className="font-bold gap-2">
                        <Download className="w-4 h-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-2xl overflow-hidden print:shadow-none print:border print:border-slate-200">
                <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex gap-4 items-center">
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <School className="h-10 w-10 text-slate-900" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black tracking-tight">HIIGSI S.M.S</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-none">Official Study Terminal</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">INVOICE</h1>
                        <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs font-bold text-slate-400 uppercase">Document No:</span>
                            <span className="font-mono text-lg font-black text-primary">{invoice.invoice_no}</span>
                        </div>
                    </div>
                </div>

                <CardContent className="p-10 space-y-12 bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <div className="font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">Billed To</div>
                            <div>
                                <div className="text-xl font-black text-slate-900">{invoice.students?.full_name}</div>
                                <div className="font-bold text-primary mt-1">Class: {invoice.students?.classes?.name}</div>
                                <div className="text-xs text-slate-400 font-mono mt-2">ID: {invoice.students?.id}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">Financial Details</div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Issue Date:</span>
                                    <span className="font-bold">{format(new Date(invoice.date), "MMMM dd, yyyy")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Due Date:</span>
                                    <span className="font-bold text-red-600">{format(new Date(invoice.due_date), "MMMM dd, yyyy")}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-slate-500 font-medium">Payment Status:</span>
                                    <Badge className={`${statusColors[invoice.status]} border-none font-bold text-[10px] uppercase shadow-none`}>
                                        {invoice.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 hidden md:block">
                            <div className="font-black text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">School Contact</div>
                            <div className="space-y-2 text-xs font-bold text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> support@hiigsi.edu
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> +252 61 XXX XXX
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> www.hiigsi.edu
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent border-slate-200">
                                    <TableHead className="font-black text-slate-900 uppercase text-xs pl-6">Fee Description</TableHead>
                                    <TableHead className="font-black text-slate-900 uppercase text-xs text-right">Student ID</TableHead>
                                    <TableHead className="font-black text-slate-900 uppercase text-xs text-right pr-6">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.invoice_items?.map((item: any) => (
                                    <TableRow key={item.id} className="border-slate-100">
                                        <TableCell className="pl-6 py-5">
                                            <div className="font-bold text-slate-800">{item.student_fees?.fee_structures?.fee_categories?.name}</div>
                                            <div className="text-xs text-slate-400 font-medium italic">Academic Year / Term Service</div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-slate-500">
                                            {invoice.students?.id}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-black text-slate-900">
                                            ${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end pt-12">
                        <div className="w-full md:w-80 space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Subtotal</span>
                                <span className="font-bold text-slate-800">${Number(invoice.total_amount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Tax / VAT</span>
                                <span className="font-bold text-slate-800">$0.00</span>
                            </div>
                            <div className="flex justify-between items-center py-4 px-6 bg-slate-900 text-white rounded-2xl shadow-xl transform scale-105">
                                <span className="text-xs font-black uppercase tracking-widest">Total Amount Due</span>
                                <span className="text-3xl font-black">${Number(invoice.total_amount).toLocaleString()}</span>
                            </div>
                            {invoice.paid_amount > 0 && (
                                <div className="flex justify-between items-center py-2 text-emerald-600 font-bold border-b border-slate-100">
                                    <span className="text-xs uppercase">Amount Paid To Date</span>
                                    <span className="">-${Number(invoice.paid_amount).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-2 text-red-600 font-black pt-4">
                                <span className="text-xl uppercase tracking-tighter">Remaining Balance</span>
                                <span className="text-2xl font-black">${Number(invoice.balance_amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 mt-20 border-t border-slate-100 grid grid-cols-2 gap-20">
                        <div className="space-y-4">
                            <div className="h-10 border-b-2 border-slate-200"></div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Authorized Signature</div>
                        </div>
                        <div className="space-y-4 flex flex-col items-center">
                            <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 inline-block uppercase tracking-[0.2em]">Validated Document</div>
                            <div className="text-[9px] text-slate-300 font-mono">Issued via Hiigsi Accounting Engine — {new Date().toISOString()}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center py-10 print:hidden">
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                    This invoice is a legal document issued by Hiigsi S.M.S. Please ensure payment is made by the due date to avoid late fees.
                </p>
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
          .shadow-2xl {
            box-shadow: none !important;
          }
          .border-none {
            border: 1px solid #e2e8f0 !important;
          }
          .rounded-3xl, .rounded-2xl {
            border-radius: 0 !important;
          }
          /* Grid adjustments for print */
          .grid {
            display: grid !important;
          }
        }
      `}</style>
        </div>
    )
}
