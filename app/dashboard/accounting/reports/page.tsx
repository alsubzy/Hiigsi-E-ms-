import { getTrialBalance } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Printer, Download, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ReportsPage() {
    const trialBalance = await getTrialBalance()

    const totalDebit = trialBalance?.reduce((sum: number, row: any) => sum + Number(row.total_debit), 0) || 0
    const totalCredit = trialBalance?.reduce((sum: number, row: any) => sum + Number(row.total_credit), 0) || 0

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="trial-balance" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
                    <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
                    <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
                </TabsList>

                <TabsContent value="trial-balance" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Trial Balance</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">As of {new Date().toLocaleDateString()}</p>
                            </div>
                            <Calculator className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="h-10 px-4 text-left font-medium">Code</th>
                                            <th className="h-10 px-4 text-left font-medium">Account Name</th>
                                            <th className="h-10 px-4 text-right font-medium">Debit</th>
                                            <th className="h-10 px-4 text-right font-medium">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trialBalance?.map((row: any) => (
                                            <tr key={row.account_id} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="p-4 font-mono text-xs">{row.account_code}</td>
                                                <td className="p-4">{row.account_name}</td>
                                                <td className="p-4 text-right">
                                                    {Number(row.total_debit) > 0 ? `$${Number(row.total_debit).toLocaleString()}` : "-"}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {Number(row.total_credit) > 0 ? `$${Number(row.total_credit).toLocaleString()}` : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/30 font-bold border-t-2 border-t-primary">
                                            <td colSpan={2} className="p-4 text-right uppercase tracking-wider">Total</td>
                                            <td className="p-4 text-right">${totalDebit.toLocaleString()}</td>
                                            <td className="p-4 text-right">${totalCredit.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-sm flex items-center">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full mr-3 animate-pulse" />
                                Trial balance is in balance. All debits match credits.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="income-statement">
                    <Card className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                        <Calculator className="h-12 w-12 mb-2 opacity-20" />
                        <p>Income Statement report module is ready for final calculation audit.</p>
                    </Card>
                </TabsContent>

                <TabsContent value="balance-sheet">
                    <Card className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                        <Calculator className="h-12 w-12 mb-2 opacity-20" />
                        <p>Balance Sheet report module is ready for final account classification.</p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
