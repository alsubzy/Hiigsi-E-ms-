import { AccountingNavTabs } from "@/components/dashboard/accounting/nav-tabs"
import { WalletCards } from "lucide-react"

export default function AccountingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    try {
        return (
            <div className="flex flex-col min-h-full bg-zinc-50/50 dark:bg-zinc-950/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-30 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <WalletCards className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                Finance Management
                            </h1>
                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mt-0.5">Commercial & Academic Ledger</p>
                        </div>
                    </div>
                    <AccountingNavTabs />
                </div>
                <div className="p-6 md:p-10 w-full max-w-[1600px] mx-auto">
                    {children}
                </div>
            </div>
        )
    } catch (error: any) {
        console.error("AccountingLayout Error:", error)
        return <div className="p-20 text-red-500 font-bold bg-white dark:bg-zinc-950 min-h-screen">Accounting Layout Error: {error.message}</div>
    }
}
