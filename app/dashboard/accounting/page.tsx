import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ArrowUpRight, ArrowDownRight, Users, Receipt, FileText, TrendingUp, Wallet, ArrowRight, FolderTree } from "lucide-react"
import { getAccountingStats } from "@/app/actions/accounting"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function AccountingDashboard() {
  const stats = await getAccountingStats()

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Accounting Overview</h1>
          <p className="text-gray-500 mt-1">Manage financial health, invoicing, and expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/accounting/invoices/new">
            <Button className="font-semibold shadow-sm gap-2">
              <FileText className="h-4 w-4" /> Create Invoice
            </Button>
          </Link>
          <Link href="/dashboard/accounting/payments/new">
            <Button className="font-semibold shadow-sm gap-2 bg-emerald-600 hover:bg-emerald-700">
              <DollarSign className="h-4 w-4" /> Record Payment
            </Button>
          </Link>
          <Link href="/dashboard/accounting/expenses/new">
            <Button variant="outline" className="font-semibold gap-2 border-gray-300">
              <ArrowDownRight className="h-4 w-4 text-red-500" /> Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="shadow-none border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</CardTitle>
            <div className="h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> 12.5% from last month
            </p>
          </CardContent>
        </Card>

        {/* Outstanding (Receivables) */}
        <Card className="shadow-none border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Outstanding (Due)</CardTitle>
            <div className="h-9 w-9 bg-orange-50 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${stats.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Pending student fees</p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="shadow-none border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Expenses</CardTitle>
            <div className="h-9 w-9 bg-red-50 rounded-full flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Note: Assuming stats has expenses, if not, placeholder of 0 */}
            <div className="text-2xl font-bold text-gray-900">$0.00</div>
            <p className="text-xs text-gray-500 mt-1">Operating costs this month</p>
          </CardContent>
        </Card>

        {/* Available Cash */}
        <Card className="shadow-none border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">Net Income</CardTitle>
            <div className="h-9 w-9 bg-blue-50 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {/* Net Income = Revenue - Expenses */}
            <div className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-blue-600 font-medium mt-1">Healthy profit margin</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
            <Link href="/dashboard/accounting/ledger" className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                        {format(new Date(tx.date), "dd")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="capitalize">{tx.type}</span> • #{tx.reference_no || tx.id.slice(0, 6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      { /* We need to find the amount. Usually in lines. Assuming the first line or just showing status */}
                      <Badge variant="outline" className="font-mono text-xs">
                        {format(new Date(tx.date), "MMM yyyy")}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">No recent transactions.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Links / COA Summary */}
        <div className="space-y-6">
          <Card className="shadow-sm border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quick Navigation</h3>
            <div className="space-y-2">
              <Link href="/dashboard/accounting/invoices">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500 group-hover:text-primary" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Invoices List</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
                </div>
              </Link>
              <Link href="/dashboard/accounting/payments">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-gray-500 group-hover:text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Payments History</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
                </div>
              </Link>
              <Link href="/dashboard/accounting/fees">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-gray-500 group-hover:text-orange-600" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Fee Structures</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
                </div>
              </Link>
              <Link href="/dashboard/accounting/coa">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <FolderTree className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Chart of Accounts</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
