"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser, updateUser } from "@/app/actions/users"
import { toast } from "sonner"
import { UserPlus, Edit2, Shield, Mail, Phone, Lock, CheckCircle2, UserCheck, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type User = {
  id: string
  email: string
  full_name: string
  role: string
  phone?: string
  status: string
}

export function UserDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "staff",
    phone: "",
    status: "active",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: "",
        full_name: user.full_name || "",
        role: user.role,
        phone: user.phone || "",
        status: user.status,
      })
    } else {
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "staff",
        phone: "",
        status: "active",
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (user) {
        // Update existing user
        const result = await updateUser(user.id, {
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone,
          status: formData.status,
        })

        if (result.success) {
          toast.success(result.message)
          onOpenChange(false)
          router.refresh()
        } else {
          toast.error(result.error || "Failed to update user")
        }
      } else {
        // Create new user
        if (!formData.password || formData.password.length < 6) {
          toast.error("Password must be at least 6 characters")
          setIsSubmitting(false)
          return
        }

        const result = await createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone,
        })

        if (result.success) {
          toast.success(result.message)
          onOpenChange(false)
          router.refresh()
        } else {
          toast.error(result.error || "Failed to create user")
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-8 bg-zinc-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
                  {user ? <Edit2 size={20} /> : <UserPlus size={20} />}
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight">{user ? "Modify Persona" : "New Personnel"}</DialogTitle>
              </div>
              <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                Establish primary authentication and access scope
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 group">
                <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Full Legal Name</Label>
                <div className="relative">
                  <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="pl-11 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Terminal Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-11 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold disabled:opacity-50"
                    placeholder="name@institution.com"
                    disabled={!!user}
                    required
                  />
                </div>
              </div>

              {!user && (
                <div className="space-y-2 group">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Access Passphrase</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-11 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight ml-1 italic">Security mandate: minimum 6 characters</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 group">
                  <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mobile Uplink</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-11 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                      placeholder="+252..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Privilege Tier</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none shadow-none focus:ring-2 focus:ring-blue-500/20 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800">
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="teacher">Educator</SelectItem>
                      <SelectItem value="accountant">Financial Officer</SelectItem>
                      <SelectItem value="staff">Operational Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {user && (
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Operational State</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className={cn(
                      "h-12 rounded-2xl border-none shadow-none focus:ring-2 focus:ring-blue-500/20 font-bold",
                      formData.status === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800">
                      <SelectItem value="active" className="text-emerald-600 font-bold">Active</SelectItem>
                      <SelectItem value="inactive" className="text-zinc-500 font-bold">Inactive</SelectItem>
                      <SelectItem value="suspended" className="text-red-600 font-bold">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Cancel Protocol
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : user ? "Update Persona" : "Initialize Personnel"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
