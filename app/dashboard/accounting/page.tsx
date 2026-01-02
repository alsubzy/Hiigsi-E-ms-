import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ArrowUpRight, ArrowDownRight, Users, Receipt, FileText } from "lucide-react"
import { getAccountingStats } from "@/app/actions/accounting"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AccountingDashboard() {
  const stats = await getAccountingStats()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/accounting/invoices/new">
            <Button>
              <FileText className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
          <Link href="/dashboard/accounting/payments/new">
            <Button variant="outline">
              <Receipt className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <ArrowUpRight className="mr-1 h-3 w-3" /> +12.5%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${stats.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Accounts Receivable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash & Bank Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.cashBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total available liquidity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Collection Rate</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalExpected > 0 ? Math.round((stats.monthlyRevenue / stats.totalExpected) * 100) : 0}%
            </div>
            <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${stats.totalExpected > 0 ? (stats.monthlyRevenue / stats.totalExpected) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent transactions found.</p>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/dashboard/accounting/coa">
              <Button variant="outline" className="w-full justify-start">
                Chart of Accounts
              </Button>
            </Link>
            <Link href="/dashboard/accounting/ledger">
              <Button variant="outline" className="w-full justify-start">
                General Ledger
              </Button>
            </Link>
            <Link href="/dashboard/accounting/reports">
              <Button variant="outline" className="w-full justify-start">
                Financial Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
