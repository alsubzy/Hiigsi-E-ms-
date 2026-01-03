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
  BookOpen,
  BarChart3,
  Settings,
  Shield,
  Briefcase,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

import { useLanguage } from "@/components/language-provider"

// ... imports remain same ...

// Remove static navGroups definition

export function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const navGroups: NavGroup[] = [
    {
      title: t("nav.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "teacher", "accountant", "staff"],
    },
    {
      title: t("nav.users"),
      icon: Shield,
      roles: ["admin", "staff"],
      subItems: [
        { title: t("nav.users"), href: "/dashboard/users", roles: ["admin"] },
        { title: t("nav.teachers"), href: "/dashboard/teachers", roles: ["admin", "staff"] },
        { title: t("nav.staff"), href: "/dashboard/staff", roles: ["admin"] },
      ],
    },
    {
      title: "Academic", // Add to translations later if missing
      icon: BookOpen,
      roles: ["admin", "teacher"],
      subItems: [
        { title: t("sidebar.schedule"), href: "/dashboard/academic/calendar", roles: ["admin"] },
        { title: "Classes", href: "/dashboard/academic/classes", roles: ["admin"] },
        { title: "Subjects", href: "/dashboard/academic/subjects", roles: ["admin"] },
        { title: t("sidebar.schedule"), href: "/dashboard/academic/timetable", roles: ["admin", "teacher"] },
        { title: "Syllabus", href: "/dashboard/academic/syllabus", roles: ["admin", "teacher"] },
      ],
    },
    {
      title: t("nav.students"),
      icon: GraduationCap,
      roles: ["admin", "teacher", "staff"],
      subItems: [
        { title: t("sidebar.allStudents"), href: "/dashboard/students", roles: ["admin", "teacher", "staff"] },
        { title: t("sidebar.attendance"), href: "/dashboard/attendance", roles: ["admin", "teacher", "staff"] },
        { title: t("sidebar.grades"), href: "/dashboard/grading", roles: ["admin", "teacher"] },
      ],
    },
    {
      title: t("nav.accounting"),
      icon: DollarSign,
      roles: ["admin", "accountant", "teacher", "staff"],
      subItems: [
        { title: t("sidebar.overview"), href: "/dashboard/accounting", roles: ["admin", "accountant", "teacher", "staff"] },
        { title: t("accounting.fees"), href: "/dashboard/accounting/fees", roles: ["admin", "accountant", "teacher", "staff"] },
        { title: t("accounting.invoices"), href: "/dashboard/accounting/invoices", roles: ["admin", "accountant", "teacher", "staff"] },
        { title: t("accounting.payments"), href: "/dashboard/accounting/payments", roles: ["admin", "accountant", "teacher", "staff"] },
        { title: t("accounting.expenses"), href: "/dashboard/accounting/expenses", roles: ["admin", "accountant", "teacher", "staff"] },
      ],
    },
    {
      title: t("nav.reports"),
      href: "/dashboard/reports",
      icon: BarChart3,
      roles: ["admin", "accountant"],
    },
    {
      title: t("nav.settings"),
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["admin", "teacher", "accountant", "staff"],
    },
  ]

  // Automatically expand the group that contains the current pathname
  useEffect(() => {
    const activeGroup = navGroups.find(group =>
      group.subItems?.some(sub => pathname.startsWith(sub.href))
    )
    if (activeGroup && !openGroups.includes(activeGroup.title)) {
      setOpenGroups(prev => [...prev, activeGroup.title])
    }
  }, [pathname])

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Logged out successfully")
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-100 dark:border-zinc-800">
        <img src="/hiigsi-logo.jpg" alt="Hiigsi Skills" className="h-10 w-10 object-contain rounded-md" />
        <div className="flex flex-col">
          <h1 className="font-bold text-base text-zinc-900 dark:text-zinc-100 leading-none">Hiigsi Skills</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-0.5">MANAGEMENT SYSTEM</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-none">
        {!isMounted ? (
          // Skeleton / Loading state to prevent hydration mismatch with Radix IDs
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          navGroups.map((group) => {
            if (!group.roles.includes(user.role)) return null

            // Direct Link Item
            if (!group.subItems && group.href) {
              const isActive = pathname === group.href
              const Icon = group.icon

              return (
                <Link
                  key={group.title}
                  href={group.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-900")} />
                  {group.title}
                </Link>
              )
            }

            // Group with Sub-items
            const isOpen = openGroups.includes(group.title)
            const isActiveGroup = group.subItems?.some(sub => pathname.startsWith(sub.href))
            const Icon = group.icon

            return (
              <Collapsible
                key={group.title}
                open={isOpen}
                onOpenChange={() => toggleGroup(group.title)}
                className="space-y-1"
              >
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActiveGroup
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/10"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", isActiveGroup ? "text-blue-600" : "text-zinc-500")} />
                    {group.title}
                  </div>
                  <ChevronRight className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isOpen && "rotate-90")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1 pb-2">
                  {group.subItems?.map((sub) => {
                    if (!sub.roles.includes(user.role)) return null
                    const isSubActive = pathname === sub.href
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center h-9 pl-11 pr-3 rounded-lg text-sm transition-colors",
                          isSubActive
                            ? "text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 font-medium"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50/50 dark:hover:bg-zinc-900"
                        )}
                      >
                        {sub.title}
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          })
        )}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-white dark:border-zinc-800 shadow-sm">
            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
            <AvatarFallback>{user.full_name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-100">{user.full_name}</p>
            <p className="text-xs text-zinc-500 truncate capitalize">{user.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 h-9 px-2"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
