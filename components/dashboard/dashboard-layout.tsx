"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import type { Profile } from "@/lib/types"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: Profile
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
