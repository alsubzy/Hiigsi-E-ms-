import { getAccounts } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, FolderTree } from "lucide-react"

export default async function COAPage() {
    const accounts = await getAccounts()

    const typeColors: Record<string, string> = {
        asset: "bg-blue-100 text-blue-800",
        liability: "bg-red-100 text-red-800",
        equity: "bg-purple-100 text-purple-800",
        income: "bg-emerald-100 text-emerald-800",
        expense: "bg-orange-100 text-orange-800",
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <FolderTree className="h-6 w-6" />
                    <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Account
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 transition-colors">
                                    <th className="h-12 px-4 text-left align-middle font-medium">Code</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium">Description</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {accounts.map((account) => (
                                    <tr key={account.id} className="border-b transition-colors hover:bg-muted/50 cursor-pointer">
                                        <td className="p-4 align-middle font-mono">{account.code}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center">
                                                {account.parent_id && <span className="mr-2 text-muted-foreground">↳</span>}
                                                <span className={account.parent_id ? "text-muted-foreground" : "font-semibold"}>
                                                    {account.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge className={typeColors[account.type] || ""}>
                                                {account.type.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">
                                            {account.description || "-"}
                                        </td>
                                        <td className="p-4 align-middle">
                                            {account.is_active ? (
                                                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-400 border-gray-200">Inactive</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
