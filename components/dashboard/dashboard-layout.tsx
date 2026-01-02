"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: Profile
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, slide-in when open */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar user={user} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header with Hamburger */}
        <div className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="shrink-0"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-white">
              <img src="/hiigsi-logo.jpg" alt="Hiigsi Skills" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Hiigsi Skills</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter leading-none">
                Management System
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
