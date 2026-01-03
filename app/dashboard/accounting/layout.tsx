import { AccountingNavTabs } from "@/components/dashboard/accounting/nav-tabs"

export default function AccountingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-full bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#1E293B] dark:text-gray-100 flex items-center gap-2">
                        Finance Management
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Commercial & Academic Ledger</p>
                </div>
                <AccountingNavTabs />
            </div>
            <div className="p-6 md:p-8 w-full">
                {children}
            </div>
        </div>
    )
}
