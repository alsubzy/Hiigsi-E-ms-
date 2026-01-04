"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: Profile
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50/50 dark:bg-zinc-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on mobile, static on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-zinc-900 border-r transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center gap-4 border-b bg-white dark:bg-zinc-950 p-4 lg:hidden shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="-ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/hiigsi-logo.jpg" alt="Logo" className="h-8 w-8 rounded-md" />
            <span className="font-bold text-base tracking-tight italic">Hiigsi Skills</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto scroll-smooth bg-gray-50/30 dark:bg-zinc-950/30">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-400">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
