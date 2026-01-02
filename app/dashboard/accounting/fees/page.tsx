import { getStudentFees } from "@/app/actions/accounting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter } from "lucide-react"

export default async function FeesPage() {
    const fees = await getStudentFees()

    const statusColors: Record<string, string> = {
        paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
        partial: "bg-blue-100 text-blue-800 border-blue-200",
        pending: "bg-orange-100 text-orange-800 border-orange-200",
        overdue: "bg-red-100 text-red-800 border-red-200",
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Student Fees</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Bulk Assign Fees
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>Fee Records</CardTitle>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input placeholder="Search students..." className="w-full pl-8 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="h-12 px-4 text-left font-medium">Student</th>
                                    <th className="h-12 px-4 text-left font-medium">Grade</th>
                                    <th className="h-12 px-4 text-left font-medium">Fee Category</th>
                                    <th className="h-12 px-4 text-left font-medium">Net Amount</th>
                                    <th className="h-12 px-4 text-left font-medium">Status</th>
                                    <th className="h-12 px-4 text-left font-medium">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No fee records found.
                                        </td>
                                    </tr>
                                ) : (
                                    fees.map((record) => (
                                        <tr key={record.id} className="border-b hover:bg-muted/50">
                                            <td className="p-4">
                                                <div className="font-medium text-blue-600">
                                                    {record.students?.full_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {record.students?.id.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="p-4">{record.students?.grade}</td>
                                            <td className="p-4">{record.fee_structures?.fee_categories?.name}</td>
                                            <td className="p-4 font-semibold">${record.net_amount}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={statusColors[record.status] || ""}>
                                                    {record.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {new Date(record.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
