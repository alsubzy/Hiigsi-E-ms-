"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  GraduationCap,
  DollarSign,
  LogOut,
  School,
  BookOpen,
  UserCheck,
  BarChart3,
  Settings,
  Shield,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  FolderTree,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

interface SidebarProps {
  user: Profile
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "teacher", "accountant", "staff"],
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Shield,
    roles: ["admin"],
  },
  {
    title: "Calendar",
    href: "/dashboard/academic/calendar",
    icon: CalendarIcon, // Need to import or use similar
    roles: ["admin"],
  },
  {
    title: "Classes",
    href: "/dashboard/academic/classes",
    icon: School,
    roles: ["admin"],
  },
  {
    title: "Subjects",
    href: "/dashboard/academic/subjects",
    icon: BookOpen,
    roles: ["admin"],
  },
  {
    title: "Timetable",
    href: "/dashboard/academic/timetable",
    icon: Clock, // Need to import
    roles: ["admin", "teacher"],
  },
  {
    title: "Syllabus",
    href: "/dashboard/academic/syllabus",
    icon: FileText, // Need to import
    roles: ["admin", "teacher"],
  },
  {
    title: "Teachers",
    href: "/dashboard/teachers",
    icon: UserCheck,
    roles: ["admin", "staff"],
  },
  {
    title: "Students",
    href: "/dashboard/students",
    icon: Users,
    roles: ["admin", "teacher", "staff"],
  },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: ClipboardCheck,
    roles: ["admin", "teacher", "staff"],
  },
  {
    title: "Grading",
    href: "/dashboard/grading",
    icon: GraduationCap,
    roles: ["admin", "teacher"],
  },
  {
    title: "Accounting",
    href: "/dashboard/accounting",
    icon: DollarSign,
    roles: ["admin", "accountant"],
  },
  {
    title: "Chart of Accounts",
    href: "/dashboard/accounting/coa",
    icon: FolderTree,
    roles: ["admin", "accountant"],
  },
  {
    title: "Student Fees",
    href: "/dashboard/accounting/fees",
    icon: Receipt,
    roles: ["admin", "accountant"],
  },
  {
    title: "General Ledger",
    href: "/dashboard/accounting/ledger",
    icon: FileText,
    roles: ["admin", "accountant"],
  },
  {
    title: "Financial Reports",
    href: "/dashboard/accounting/reports",
    icon: BarChart3,
    roles: ["admin", "accountant"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["admin", "teacher", "accountant", "staff"],
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role))

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Successfully logged out.")
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <School className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">School System</span>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user.full_name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium">{user.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
