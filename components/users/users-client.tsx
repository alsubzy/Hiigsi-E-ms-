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
import { Plus, Search, MoreVertical, Shield, Users, CheckCircle, XCircle } from "lucide-react"
import { UserDialog } from "./user-dialog"
import { StaffDialog } from "./staff-dialog"
import { PasswordResetDialog } from "./password-reset-dialog"
import { deleteUser, toggleUserStatus, resetUserPassword } from "@/app/actions/users"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type User = {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  last_login: string | null
  created_at: string
  phone?: string // Added missing optional field
  staff?: {
    employee_id: string
    department: string
    designation: string
    employment_status: string
    // Add optional fields that StaffDialog might expect
    qualification?: string
    experience_years?: number
    date_of_joining: string // Changed to mandatory
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

  const stats = {
    total: totalCount,
    active: initialUsers.filter((u: User) => u.status === "active").length,
    inactive: initialUsers.filter((u: User) => u.status === "inactive").length,
    withStaff: initialUsers.filter((u: User) => u.staff).length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Profiles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withStaff}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage system users and their access</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedUser(null)
                    setIsUserDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Staff Info</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "active" ? "default" : "destructive"}>{user.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.staff ? (
                              <div className="text-sm">
                                <div className="font-medium">{user.staff.employee_id}</div>
                                <div className="text-muted-foreground">{user.staff.designation}</div>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleAddStaff(user)}>
                                Add Staff Info
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsUserDialogOpen(true)
                                  }}
                                >
                                  Edit User
                                </DropdownMenuItem>
                                {user.staff && (
                                  <DropdownMenuItem onClick={() => handleAddStaff(user)}>
                                    Edit Staff Info
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                                  {user.status === "active" ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>View role-based access control configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roles.map((role: any) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{role.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <Badge>{role.name}</Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {role.role_permissions?.map((rp: any) => (
                          <Badge key={rp.permissions.id} variant="outline">
                            {rp.permissions.module}.{rp.permissions.action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Track all system activities and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                          <TableCell>{log.profiles?.full_name || log.profiles?.email || "System"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.module}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserDialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen} user={selectedUser} />

      <StaffDialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen} user={selectedUser} />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
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
