"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
    { name: "Collection", href: "/dashboard/accounting/collection" },
    { name: "Invoices", href: "/dashboard/accounting/invoices" },
    { name: "Payments", href: "/dashboard/accounting/payments" },
    { name: "Expenses", href: "/dashboard/accounting/expenses" },
    { name: "Assignments", href: "/dashboard/accounting/fees" },
    { name: "Structures", href: "/dashboard/accounting/structures" },
    { name: "Chart of Accounts", href: "/dashboard/accounting/coa" },
    { name: "Ledger", href: "/dashboard/accounting/ledger" },
    { name: "Reports", href: "/dashboard/accounting/reports" },
]

export function AccountingNavTabs() {
    const pathname = usePathname()

    return (
        <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-lg w-fit">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href)
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            isActive
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                        )}
                    >
                        {tab.name}
                    </Link>
                )
            })}
        </div>
    )
}
