"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DollarSign, TrendingUp, Clock, Receipt, Search, Plus } from "lucide-react"
import { PaymentDialog } from "@/components/accounting/payment-dialog"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  roll_number: string
  class_name: string
  section: string
}

interface Payment {
  id: string
  student_id: string
  amount: number
  payment_date: string
  payment_method: string
  fee_type: string
  transaction_id?: string
  status: string
  created_at: string
  student: {
    name: string
    roll_number: string
    class_name: string
    section: string
  }
}

interface AccountingClientProps {
  initialStats: {
    totalRevenue: number
    completedPayments: number
    pendingAmount: number
    pendingPayments: number
  }
  initialStudents: Student[]
  initialPayments: Payment[]
}

export function AccountingClient({ initialStats, initialStudents, initialPayments }: AccountingClientProps) {
  const [view, setView] = useState<"overview" | "fees" | "transactions">("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>()
  const [students] = useState(initialStudents)
  const [payments] = useState(initialPayments)
  const [stats] = useState(initialStats)

  const handleRecordPayment = (student: Student) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const handlePaymentSuccess = () => {
    // Refresh the page to get updated data
    window.location.reload()
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredPayments = payments.filter(
    (payment) =>
      payment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Completed Payments",
      value: stats.completedPayments,
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      title: "Pending Amount",
      value: `$${stats.pendingAmount.toLocaleString()}`,
      icon: Clock,
      color: "text-orange-500",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: Receipt,
      color: "text-red-500",
    },
  ]

  // Group payments by method for overview
  const paymentsByMethod = payments.reduce(
    (acc, payment) => {
      const method = payment.payment_method
      acc[method] = (acc[method] || 0) + payment.amount
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <>
      <Header title="Accounting & Fee Management" description="Manage student fees and track payments" />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <Button variant={view === "overview" ? "default" : "outline"} onClick={() => setView("overview")}>
            Overview
          </Button>
          <Button variant={view === "fees" ? "default" : "outline"} onClick={() => setView("fees")}>
            Fee Status
          </Button>
          <Button variant={view === "transactions" ? "default" : "outline"} onClick={() => setView("transactions")}>
            Transactions
          </Button>
        </div>

        {view === "overview" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <Icon className={cn("h-4 w-4", stat.color)} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(paymentsByMethod).length > 0 ? (
                      Object.entries(paymentsByMethod).map(([method, amount]) => (
                        <div key={method} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{method.replace("_", " ")}</span>
                          <span className="font-semibold">${amount.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No payments recorded yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payments.length > 0 ? (
                      payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{payment.student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="font-semibold">${payment.amount.toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No transactions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {view === "fees" && (
          <>
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          {student.class_name}
                          {student.section}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleRecordPayment(student)}>
                            <Plus className="mr-1 h-3 w-3" />
                            Record Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No students found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {view === "transactions" && (
          <>
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, roll number, or transaction ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-sm">{payment.transaction_id || "-"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.student.name}</p>
                            <p className="text-xs text-muted-foreground">{payment.student.roll_number}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{payment.fee_type.replace("_", " ")}</TableCell>
                        <TableCell className="capitalize">{payment.payment_method.replace("_", " ")}</TableCell>
                        <TableCell className="text-right font-semibold">${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={selectedStudent}
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
