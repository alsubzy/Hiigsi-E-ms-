import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ArrowUpRight, ArrowDownRight, Users, Receipt, FileText, TrendingUp, Wallet, ArrowRight } from "lucide-react"
import { getAccountingStats } from "@/app/actions/accounting"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function AccountingDashboard() {
  const stats = await getAccountingStats()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1E293B]">Financial Overview</h1>
          <p className="text-muted-foreground font-medium">Real-time health of school finances and student billing</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/accounting/invoices/new">
            <Button className="font-bold shadow-lg shadow-primary/20">
              <FileText className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
          <Link href="/dashboard/accounting/fees">
            <Button variant="outline" className="font-bold">
              Manage Fees
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">${stats.monthlyRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-bold text-emerald-600 inline-flex items-center">
                +12.5%
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Accounts Receivable</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">${stats.pendingAmount.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Outstanding Student Fees</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Available Liquidity</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">${stats.cashBalance.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Cash & Bank Accounts</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden bg-slate-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Collection Rate</CardTitle>
            <Receipt className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">
              {stats.totalExpected > 0 ? Math.round((stats.monthlyRevenue / stats.totalExpected) * 100) : 0}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${stats.totalExpected > 0 ? (stats.monthlyRevenue / stats.totalExpected) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black">Recent Journal Entries</CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Latest activity across all ledger accounts</p>
            </div>
            <Link href="/dashboard/accounting/ledger">
              <Button variant="ghost" size="sm" className="font-bold text-primary">
                View Full Ledger <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-mono text-[10px] font-bold">
                      {format(new Date(tx.date), "dd MMM")}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{tx.description}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tighter opacity-70">
                          {tx.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">{tx.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/dashboard/accounting/ledger?tx=${tx.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
              {stats.recentTransactions.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                  <p className="font-bold">No recent activity found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black">Performance & Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Operating Efficiency</span>
                <span className="text-sm font-black text-emerald-600">Optimal</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">BUDGET UTILIZATION</span>
                  <span>84%</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full">
                  <div className="bg-emerald-500 h-full w-[84%] rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">COLLECTION DELAY</span>
                  <span className="text-orange-500">Avg 4.2 Days</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full">
                  <div className="bg-orange-500 h-full w-[42%] rounded-full" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/accounting/reports" className="col-span-1">
                <Button variant="outline" className="w-full font-bold h-12 flex flex-col gap-0 items-start px-4">
                  <span className="text-xs">Generate</span>
                  <span className="text-primary">Reports</span>
                </Button>
              </Link>
              <Link href="/dashboard/accounting/audit" className="col-span-1">
                <Button variant="outline" className="w-full font-bold h-12 flex flex-col gap-0 items-start px-4">
                  <span className="text-xs">Security</span>
                  <span className="text-red-500">Audit Logs</span>
                </Button>
              </Link>
              <Link href="/dashboard/accounting/coa" className="col-span-2">
                <Button variant="secondary" className="w-full font-bold h-12 gap-2">
                  <FolderTree className="h-4 w-4" /> Chart of Accounts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
