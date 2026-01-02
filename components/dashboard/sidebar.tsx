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
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"

interface SidebarProps {
  user: Profile
  onClose?: () => void
}


interface NavSubItem {
  title: string
  href: string
  roles: string[]
}

interface NavGroup {
  title: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  href?: string // If it's a direct link
  subItems?: NavSubItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "teacher", "accountant", "staff"],
  },
  {
    title: "Users & Personnel",
    icon: Shield,
    roles: ["admin", "staff"],
    subItems: [
      { title: "User Management", href: "/dashboard/users", roles: ["admin"] },
      { title: "Teachers", href: "/dashboard/teachers", roles: ["admin", "staff"] },
      { title: "Staff Directory", href: "/dashboard/staff", roles: ["admin"] },
    ],
  },
  {
    title: "Academic",
    icon: BookOpen,
    roles: ["admin", "teacher"],
    subItems: [
      { title: "Academic Calendar", href: "/dashboard/academic/calendar", roles: ["admin"] },
      { title: "Classes", href: "/dashboard/academic/classes", roles: ["admin"] },
      { title: "Subjects", href: "/dashboard/academic/subjects", roles: ["admin"] },
      { title: "Timetable", href: "/dashboard/academic/timetable", roles: ["admin", "teacher"] },
      { title: "Syllabus", href: "/dashboard/academic/syllabus", roles: ["admin", "teacher"] },
    ],
  },
  {
    title: "Students",
    icon: GraduationCap,
    roles: ["admin", "teacher", "staff"],
    subItems: [
      { title: "Student Directory", href: "/dashboard/students", roles: ["admin", "teacher", "staff"] },
      { title: "Attendance", href: "/dashboard/attendance", roles: ["admin", "teacher", "staff"] },
      { title: "Grading & Exams", href: "/dashboard/grading", roles: ["admin", "teacher"] },
    ],
  },
  {
    title: "Accounting",
    icon: DollarSign,
    roles: ["admin", "accountant"],
    subItems: [
      { title: "Overview", href: "/dashboard/accounting", roles: ["admin", "accountant"] },
      { title: "Chart of Accounts", href: "/dashboard/accounting/coa", roles: ["admin", "accountant"] },
      { title: "Student Fees", href: "/dashboard/accounting/fees", roles: ["admin", "accountant"] },
      { title: "Invoices", href: "/dashboard/accounting/invoices", roles: ["admin", "accountant"] },
      { title: "Payments", href: "/dashboard/accounting/payments", roles: ["admin", "accountant"] },
      { title: "Expenses", href: "/dashboard/accounting/expenses", roles: ["admin", "accountant"] },
      { title: "Other Income", href: "/dashboard/accounting/income", roles: ["admin", "accountant"] },
      { title: "General Ledger", href: "/dashboard/accounting/ledger", roles: ["admin", "accountant"] },
      { title: "Financial Reports", href: "/dashboard/accounting/reports", roles: ["admin", "accountant"] },
      { title: "Audit Logs", href: "/dashboard/accounting/audit", roles: ["admin"] },
    ],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
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

export function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  // Automatically expand the group that contains the current pathname
  useEffect(() => {
    const activeGroup = navGroups.find(group =>
      group.subItems?.some(sub => pathname.startsWith(sub.href))
    )
    if (activeGroup && !openGroups.includes(activeGroup.title)) {
      setOpenGroups(prev => [...prev, activeGroup.title])
    }
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Successfully logged out.")
    router.push("/login")
    router.refresh()
  }

  const renderNavGroup = (group: NavGroup) => {
    const Icon = group.icon
    const hasSubItems = group.subItems && group.subItems.length > 0
    const isUserAuthorized = group.roles.includes(user.role)

    if (!isUserAuthorized) return null

    if (!hasSubItems && group.href) {
      const isActive = pathname === group.href
      return (
        <Link
          key={group.title}
          href={group.href}
          onClick={() => onClose?.()}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
          {group.title}
        </Link>
      )
    }

    return (
      <AccordionItem value={group.title} key={group.title} className="border-none">
        <AccordionTrigger
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted hover:no-underline group",
            group.subItems?.some(sub => pathname.startsWith(sub.href)) ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", group.subItems?.some(sub => pathname.startsWith(sub.href)) ? "text-primary" : "text-muted-foreground")} />
            <span>{group.title}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-2 pl-9 space-y-1">
          {group.subItems?.map((sub) => {
            if (!sub.roles.includes(user.role)) return null
            const isSubActive = pathname === sub.href
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => onClose?.()}
                className={cn(
                  "block px-3 py-2 text-xs font-medium rounded-md transition-all border-l",
                  isSubActive
                    ? "text-primary border-primary bg-primary/5"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-gray-200"
                )}
              >
                {sub.title}
              </Link>
            )
          })}
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
          <School className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight">HIIGSI S.M.S</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Management System</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-6">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4 pl-2">Main Menu</p>
          <Accordion
            type="multiple"
            value={openGroups}
            onValueChange={setOpenGroups}
            className="space-y-1"
          >
            {navGroups.map(renderNavGroup)}
          </Accordion>
        </div>
      </div>

      <div className="border-t p-4 bg-muted/20">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold shadow-sm">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-foreground truncate">{user.full_name}</p>
            <p className="text-[10px] text-muted-foreground font-semibold capitalize bg-muted/50 w-fit px-1.5 rounded mt-0.5">{user.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full h-10 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all group"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-bold text-xs uppercase tracking-wider">Logout</span>
        </Button>
      </div>
    </div>
  )
}
