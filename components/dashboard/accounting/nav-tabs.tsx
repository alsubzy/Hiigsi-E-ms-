"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import {
    Wallet,
    FileText,
    CreditCard,
    TrendingDown,
    UserPlus,
    Layers,
    TableProperties,
    BarChart3,
    History
} from "lucide-react"

const tabs = [
    { name: "Collection", href: "/dashboard/accounting/collection", icon: Wallet },
    { name: "Invoices", href: "/dashboard/accounting/invoices", icon: FileText },
    { name: "Payments", href: "/dashboard/accounting/payments", icon: History },
    { name: "Expenses", href: "/dashboard/accounting/expenses", icon: TrendingDown },
    { name: "Assignments", href: "/dashboard/accounting/fees", icon: UserPlus },
    { name: "Structures", href: "/dashboard/accounting/structures", icon: Layers },
    { name: "Chart of Accounts", href: "/dashboard/accounting/coa", icon: TableProperties },
    { name: "Ledger", href: "/dashboard/accounting/ledger", icon: BarChart3 },
    { name: "Reports", href: "/dashboard/accounting/reports", icon: BarChart3 },
]

export function AccountingNavTabs() {
    const pathname = usePathname()

    return (
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar max-w-[calc(100vw-3rem)]">
            {tabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href)
                const Icon = tab.icon
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            "relative px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 whitespace-nowrap",
                            isActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 dark:text-zinc-400"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <Icon size={14} className="relative z-10" />
                        <span className="relative z-10">{tab.name}</span>
                    </Link>
                )
            })}
        </div>
    )
}
