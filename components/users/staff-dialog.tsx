"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
        window.location.reload()
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user.staff ? "Edit Staff Profile" : "Create Staff Profile"}</DialogTitle>
          <DialogDescription>Add employment and contact information for {user.full_name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">Date of Joining</Label>
              <Input
                id="dateOfJoining"
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceYears">Experience (Years)</Label>
              <Input
                id="experienceYears"
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : user.staff ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
