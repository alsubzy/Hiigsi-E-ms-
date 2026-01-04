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
import { Textarea } from "@/components/ui/textarea"
import { createStaffProfile, updateStaffProfile } from "@/app/actions/users"
import { toast } from "sonner"
import { Fingerprint, Building2, Briefcase, Calendar, GraduationCap, Clock, Wallet, MapPin, Contact, Phone, UserCheck, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type User = {
  id: string
  full_name: string
  staff?: {
    employee_id: string
    department: string
    designation: string
    qualification?: string
    experience_years?: number
    date_of_joining: string
    salary?: number
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
  }
}

export function StaffDialog({
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
    employeeId: "",
    department: "",
    designation: "",
    qualification: "",
    experienceYears: "",
    dateOfJoining: "",
    salary: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user?.staff) {
      setFormData({
        employeeId: user.staff.employee_id || "",
        department: user.staff.department || "",
        designation: user.staff.designation || "",
        qualification: user.staff.qualification || "",
        experienceYears: user.staff.experience_years?.toString() || "",
        dateOfJoining: user.staff.date_of_joining || "",
        salary: user.staff.salary?.toString() || "",
        address: user.staff.address || "",
        emergencyContactName: user.staff.emergency_contact_name || "",
        emergencyContactPhone: user.staff.emergency_contact_phone || "",
      })
    } else {
      setFormData({
        employeeId: "",
        department: "",
        designation: "",
        qualification: "",
        experienceYears: "",
        dateOfJoining: new Date().toISOString().split("T")[0],
        salary: "",
        address: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      const data = {
        userId: user.id,
        employeeId: formData.employeeId,
        department: formData.department,
        designation: formData.designation,
        qualification: formData.qualification || undefined,
        experienceYears: formData.experienceYears ? Number.parseInt(formData.experienceYears) : undefined,
        dateOfJoining: formData.dateOfJoining,
        salary: formData.salary ? Number.parseFloat(formData.salary) : undefined,
        address: formData.address || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
      }

      const result = user.staff ? await updateStaffProfile(user.id, data) : await createStaffProfile(data)

      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to save staff profile")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-8 bg-zinc-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
                  <Fingerprint size={20} />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight">{user.staff ? "Modify Credential" : "Initialize Employment"}</DialogTitle>
              </div>
              <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                Link institutional identity to {user.full_name}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Employment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={14} className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Employment Protocol</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Serial identifier</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                      placeholder="EMP-001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Functional Title</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                      placeholder="Principal / Accountant"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Organizational Unit</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                      placeholder="Academic / Administration"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Personal Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap size={14} className="text-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Credentials & Rewards</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfJoining" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Onboarding Date</Label>
                    <Input
                      id="dateOfJoining"
                      type="date"
                      value={formData.dateOfJoining}
                      onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                      className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Periodic Remuneration</Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                      <Input
                        id="salary"
                        type="number"
                        step="0.01"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="pl-9 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experienceYears" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tenure (Years)</Label>
                      <Input
                        id="experienceYears"
                        type="number"
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                        className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qualification" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Highest Degree</Label>
                      <Input
                        id="qualification"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                        placeholder="Masters"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Contact size={14} className="text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Emergency & Logistics</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Residential Coordinates</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold min-h-[100px]"
                      placeholder="Enter physical address..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 group">
                    <Label htmlFor="emergencyContactName" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Emergency Liaison</Label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-emerald-500" />
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        className="pl-9 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                        placeholder="Contact person"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="emergencyContactPhone" className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Liaison Contact</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-emerald-500" />
                      <Input
                        id="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        className="pl-9 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                        placeholder="+252..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Retract Update
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-14 px-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-500/20 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Syncing..." : user.staff ? "Commit Changes" : "Establish Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
