"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Student } from "@/lib/types"
import { createStudent, updateStudent } from "@/app/actions/students"
import { getClasses, type ClassRange, getSections, type Section } from "@/app/actions/classes"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface StudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student
}

export function StudentDialog({ open, onOpenChange, student }: StudentDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState<ClassRange[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [formData, setFormData] = useState({
    roll_number: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male" as "male" | "female" | "other",
    email: "",
    phone: "",
    address: "",
    section_id: "",
    admission_date: new Date().toISOString().split("T")[0],
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    blood_group: "",
    status: "active" as "active" | "inactive",
  })

  // Fetch classes when dialog opens
  useEffect(() => {
    if (open) {
      getClasses().then((response) => {
        if (response.success) {
          setClasses(response.data)
        }
      })
    }
  }, [open])

  // Fetch sections when class is selected
  useEffect(() => {
    if (selectedClassId) {
      getSections().then((response) => {
        if (response.success) {
          const classSections = response.data.filter(s => s.class_id === selectedClassId && s.status === 'active')
          setSections(classSections)
        }
      })
    } else {
      setSections([])
    }
  }, [selectedClassId])

  useEffect(() => {
    if (student) {
      // Set class ID from student's section
      const classId = student.section?.class_id || ""
      setSelectedClassId(classId)

      setFormData({
        roll_number: student.roll_number,
        first_name: student.first_name,
        last_name: student.last_name,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        email: student.email || "",
        phone: student.phone || "",
        address: student.address || "",
        section_id: student.section_id || "",
        admission_date: student.admission_date,
        parent_name: student.parent_name,
        parent_phone: student.parent_phone,
        parent_email: student.parent_email || "",
        blood_group: student.blood_group || "",
        status: student.status,
      })
    } else {
      setSelectedClassId("")
      setFormData({
        roll_number: "",
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "male",
        email: "",
        phone: "",
        address: "",
        section_id: "",
        admission_date: new Date().toISOString().split("T")[0],
        parent_name: "",
        parent_phone: "",
        parent_email: "",
        blood_group: "",
        status: "active",
      })
    }
  }, [student, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (student) {
        await updateStudent(student.id, formData)
        toast.success("Student updated successfully")
      } else {
        await createStudent(formData)
        toast.success("Student created successfully")
      }
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to save student: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roll_number">Roll Number *</Label>
              <Input
                id="roll_number"
                value={formData.roll_number}
                onChange={(e) => handleChange("roll_number", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood Group</Label>
              <Input
                id="blood_group"
                value={formData.blood_group}
                onChange={(e) => handleChange("blood_group", e.target.value)}
                placeholder="e.g., O+, A+, B+"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_select">Class *</Label>
              <Select
                value={selectedClassId}
                onValueChange={(value) => {
                  setSelectedClassId(value)
                  setFormData({ ...formData, section_id: "" }) // Reset section when class changes
                }}
                required
              >
                <SelectTrigger id="class_select">
                  <SelectValue placeholder={classes.length === 0 ? "No classes available" : "Select a class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .filter(c => c.status === "active")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {classes.length === 0 && (
                <p className="text-xs text-red-500">
                  No active classes found. Please create a class first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="section_id">Section *</Label>
              <Select
                value={formData.section_id}
                onValueChange={(value) => handleChange("section_id", value)}
                disabled={!selectedClassId}
                required
              >
                <SelectTrigger id="section_id">
                  <SelectValue placeholder={
                    !selectedClassId
                      ? "Select a class first"
                      : sections.length === 0
                        ? "No sections available"
                        : "Select a section"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      Section {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClassId && sections.length === 0 && (
                <p className="text-xs text-red-500">
                  No sections found for this class. Please create a section first.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admission_date">Admission Date *</Label>
              <Input
                id="admission_date"
                type="date"
                value={formData.admission_date}
                onChange={(e) => handleChange("admission_date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="parent_name">Parent/Guardian Name *</Label>
              <Input
                id="parent_name"
                value={formData.parent_name}
                onChange={(e) => handleChange("parent_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_phone">Parent/Guardian Phone *</Label>
              <Input
                id="parent_phone"
                value={formData.parent_phone}
                onChange={(e) => handleChange("parent_phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="parent_email">Parent/Guardian Email</Label>
              <Input
                id="parent_email"
                type="email"
                value={formData.parent_email}
                onChange={(e) => handleChange("parent_email", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : student ? "Save Changes" : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
