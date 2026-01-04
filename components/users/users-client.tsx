"use client"

import { useRouter } from "next/navigation"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreVertical, Shield, Users, CheckCircle, XCircle, LayoutGrid, Activity, ShieldCheck, Mail, Phone, Calendar, Clock, ArrowUpRight, UserPlus, Fingerprint, Lock, Trash2, Edit2, AlertCircle } from "lucide-react"
import { UserDialog } from "./user-dialog"
import { StaffDialog } from "./staff-dialog"
import { PasswordResetDialog } from "./password-reset-dialog"
import { deleteUser, toggleUserStatus, resetUserPassword } from "@/app/actions/users"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type User = {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  last_login: string | null
  created_at: string
  phone?: string
  staff?: {
    employee_id: string
    department: string
    designation: string
    employment_status: string
    qualification?: string
    experience_years?: number
    date_of_joining: string
    salary?: number
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
  }
}

export default function UsersClient({
  users: initialUsers,
  auditLogs,
  roles,
  permissions,
  totalCount,
  currentPage,
  pageSize,
}: {
  users: User[]
  auditLogs: any[]
  roles: any[]
  permissions: any[]
  totalCount: number
  currentPage: number
  pageSize: number
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToModify, setUserToModify] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("users")
  const router = useRouter()

  const handlePageChange = (newPage: number) => {
    router.push(`/dashboard/users?page=${newPage}`)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const filteredUsers = initialUsers.filter(
    (user: User) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDeleteUser = (userId: string) => {
    setUserToModify(userId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToModify) return
    const result = await deleteUser(userToModify)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete user")
    }
    setUserToModify(null)
  }

  const handleToggleStatus = async (userId: string) => {
    const result = await toggleUserStatus(userId)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update user status")
    }
  }

  const handleResetPassword = (userId: string) => {
    setUserToModify(userId)
    setIsPasswordResetOpen(true)
  }

  const confirmResetPassword = async (newPassword: string) => {
    if (!userToModify) return
    const result = await resetUserPassword(userToModify, newPassword)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.error || "Failed to reset password")
    }
    setUserToModify(null)
  }

  const handleAddStaff = (user: User) => {
    setSelectedUser(user)
    setIsStaffDialogOpen(true)
  }

  const stats = [
    {
      title: "Total Users",
      value: totalCount,
      icon: <Users className="w-5 h-5" />,
      color: "bg-blue-500",
      lightColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Active Users",
      value: initialUsers.filter((u: User) => u.status === "active").length,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 dark:bg-emerald-900/20",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Inactive",
      value: initialUsers.filter((u: User) => u.status === "inactive").length,
      icon: <XCircle className="w-5 h-5" />,
      color: "bg-amber-500",
      lightColor: "bg-amber-50 dark:bg-amber-900/20",
      textColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Staff Team",
      value: initialUsers.filter((u: User) => u.staff).length,
      icon: <Fingerprint className="w-5 h-5" />,
      color: "bg-purple-500",
      lightColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Stats row with animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-none shadow-lg shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", stat.lightColor, stat.textColor)}>
                    {stat.icon}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Live Status
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{stat.value}</h3>
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs id="users-module-tabs" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="bg-white dark:bg-zinc-950 p-1.5 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/40 dark:shadow-none h-auto">
            <TabsTrigger
              value="users"
              className="px-8 py-3 rounded-full data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-900 transition-all font-bold text-sm tracking-tight"
            >
              System Users
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="px-8 py-3 rounded-full data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-900 transition-all font-bold text-sm tracking-tight"
            >
              Privileges
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="px-8 py-3 rounded-full data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-900 transition-all font-bold text-sm tracking-tight"
            >
              Security Log
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent key="users-content" value="users" className="mt-0 focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">Active Personnel</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Manage institutional accounts and access profiles.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                          placeholder="Search directory..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-11 h-12 w-full md:w-[300px] rounded-2xl bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedUser(null)
                          setIsUserDialogOpen(true)
                        }}
                        className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                      >
                        <UserPlus size={18} /> Add User
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                          <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest pl-10 py-6">Identity</TableHead>
                          <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest py-6">Account Details</TableHead>
                          <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest py-6">Privilege</TableHead>
                          <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest py-6">Status</TableHead>
                          <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest py-6">Employment</TableHead>
                          <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest py-6">Last Active</TableHead>
                          <TableHead className="text-right pr-10 py-6 font-black text-zinc-400 uppercase text-[10px] tracking-widest">Protocol</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-40 text-center text-zinc-400 font-medium italic">
                              No personnel found matching your criteria.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user, idx) => (
                            <motion.tr
                              key={`user-${user.id || idx}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                            >
                              <TableCell className="pl-10">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold border border-zinc-200 dark:border-zinc-700">
                                    {user.full_name?.charAt(0) || user.email.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-black text-zinc-900 dark:text-white">{user.full_name || "Anonymous"}</div>
                                    <div className="text-[10px] font-bold text-zinc-400 tracking-tight">{user.id.split('-')[0]}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs">
                                    <Mail size={12} className="text-zinc-400" />
                                    {user.email}
                                  </div>
                                  {user.phone && (
                                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                      <Phone size={12} />
                                      {user.phone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn(
                                  "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                  user.role === "admin"
                                    ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                    : "bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700"
                                )}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                  user.status === "active"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                                    : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                )}>
                                  {user.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.staff ? (
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">{user.staff.employee_id}</div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                                      <Shield size={10} />
                                      {user.staff.designation}
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddStaff(user)}
                                    className="h-8 rounded-xl border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all"
                                  >
                                    Assign Staff
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                  <Clock size={12} className="text-zinc-400" />
                                  {user.last_login ? new Date(user.last_login).toISOString().split('T')[0] : "Never"}
                                </div>
                              </TableCell>
                              <TableCell className="text-right pr-10">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                      <MoreVertical className="h-4 w-4 text-zinc-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-[1.5rem] border-zinc-100 dark:border-zinc-800 shadow-2xl">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-3 py-2">Account Management</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUser(user)
                                        setIsUserDialogOpen(true)
                                      }}
                                      className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer font-bold text-sm"
                                    >
                                      <Edit2 size={14} className="text-blue-500" /> Edit Profile
                                    </DropdownMenuItem>
                                    {user.staff && (
                                      <DropdownMenuItem onClick={() => handleAddStaff(user)} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer font-bold text-sm">
                                        <Fingerprint size={14} className="text-purple-500" /> Employment Details
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="my-2 bg-zinc-50 dark:bg-zinc-900" />
                                    <DropdownMenuItem onClick={() => handleToggleStatus(user.id)} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer font-bold text-sm text-amber-600">
                                      <Activity size={14} /> {user.status === "active" ? "Suspend Account" : "Reactivate Account"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleResetPassword(user.id)} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer font-bold text-sm">
                                      <Lock size={14} /> Authenticator Reset
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-2 bg-zinc-50 dark:bg-zinc-900" />
                                    <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="rounded-xl flex items-center gap-2 py-2.5 cursor-pointer font-bold text-sm text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                                      <Trash2 size={14} /> Terminate Record
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent key="roles-content" value="roles" className="mt-0 focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">Access Hierarchies</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Define role-based permissions and system-level privileges.</p>
                  </div>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role: any, idx: number) => (
                      <motion.div
                        key={`role-${role.id || idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:border-blue-500/30 transition-all hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ShieldCheck size={18} />
                          </div>
                          <Badge className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[9px] font-black uppercase tracking-widest">{role.name}</Badge>
                        </div>
                        <h4 className="font-black text-lg text-zinc-900 dark:text-white mb-1">{role.display_name}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-6 italic">{role.description}</p>

                        <div className="space-y-3">
                          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Granted Modules</div>
                          <div className="flex flex-wrap gap-2">
                            {role.role_permissions?.map((rp: any) => (
                              <div key={rp.permissions.id} className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                {rp.permissions.module}:{rp.permissions.action}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent key="audit-content" value="audit" className="mt-0 focus-visible:outline-none">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950 rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">Security Ledger</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Real-time surveillance of system-wide administrative actions.</p>
                    </div>
                    <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                      Live Monitor
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                        <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest pl-10 py-6">Timestamp</TableHead>
                        <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest py-6">Operative</TableHead>
                        <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest py-6">Action Protocol</TableHead>
                        <TableHead className="font-black text-zinc-400 uppercase text-[10px] tracking-widest py-6">Module Scope</TableHead>
                        <TableHead className="text-right pr-10 py-6 font-black text-zinc-400 uppercase text-[10px] tracking-widest">Verification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-40 text-center text-zinc-400 font-medium italic">
                            Clear ledger. No recent activity detected.
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log: any, idx: number) => (
                          <motion.tr
                            key={`log-${log.id || idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 transition-colors group"
                          >
                            <TableCell className="pl-10">
                              <div className="flex flex-col">
                                <span className="font-black text-zinc-900 dark:text-white text-xs">
                                  {new Date(log.created_at).toISOString().split('T')[0]}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 tabular-nums">
                                  {new Date(log.created_at).toTimeString().split(' ')[0]}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-zinc-700 dark:text-zinc-300">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
                                  {log.profiles?.full_name?.charAt(0) || "S"}
                                </div>
                                {log.profiles?.full_name || log.profiles?.email || "System Intelligence"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight text-zinc-400">
                                <LayoutGrid size={10} />
                                {log.module}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-10">
                              <ShieldCheck size={14} className="inline-block text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <div className="flex items-center justify-between pt-4">
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">End of Personnel directory</p>
        <div className="flex items-center gap-2">
          {/* Pagination placeholder if needed */}
        </div>
      </div>

      <UserDialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen} user={selectedUser} />

      <StaffDialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen} user={selectedUser} />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteUser}
        title="Terminate Personnel Record"
        description="Are you sure you want to proceed with permanent record termination? This action is irreversible within the current directory."
        confirmText="Confirm Termination"
        variant="destructive"
      />

      <PasswordResetDialog
        open={isPasswordResetOpen}
        onOpenChange={setIsPasswordResetOpen}
        onConfirm={confirmResetPassword}
      />
    </div>
  )
}
