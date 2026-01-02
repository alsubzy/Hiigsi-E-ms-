import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Hash, FileText } from "lucide-react"

export default async function LedgerPage() {
    const supabase = await createClient()

    // Fetch transactions with their journal entries
    const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
      *,
      journal_entries (
        *,
        account:account_id (code, name)
      )
    `)
        .order("date", { ascending: false })
        .limit(50)

    if (error) {
        return <div>Error loading ledger: {error.message}</div>
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">General Ledger</h2>
                <div className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="mr-2 h-4 w-4" /> Academic Year: 2025-2026
                </div>
            </div>

            {transactions?.map((tx) => (
                <Card key={tx.id} className="overflow-hidden border-l-4 border-l-primary">
                    <CardHeader className="bg-muted/30 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="font-mono text-sm bg-background px-2 py-1 rounded border">
                                    {tx.date}
                                </div>
                                <Badge variant="secondary">{tx.type.replace('_', ' ').toUpperCase()}</Badge>
                                <div className="font-semibold">{tx.description}</div>
                            </div>
                            <div className="text-sm font-mono text-muted-foreground">
                                <Hash className="inline h-3 w-3 mr-1" />
                                {tx.id.slice(0, 8)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[120px]">Account Code</TableHead>
                                    <TableHead>Account Name</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tx.journal_entries?.map((je: any) => (
                                    <TableRow key={je.id}>
                                        <TableCell className="font-mono text-xs">{je.account?.code}</TableCell>
                                        <TableCell>
                                            <div className={je.credit > 0 ? "pl-6 italic" : ""}>
                                                {je.account?.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {je.debit > 0 ? `$${je.debit.toLocaleString()}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            {je.credit > 0 ? `$${je.credit.toLocaleString()}` : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}

            {(!transactions || transactions.length === 0) && (
                <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10">
                    <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                    <p>No transactions found in the ledger.</p>
                </div>
            )}
        </div>
    )
}
