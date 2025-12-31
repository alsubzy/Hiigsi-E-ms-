"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClass, getActiveAcademicYear } from "@/app/actions/academic"
import { toast } from "@/hooks/use-toast"

interface ClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classData?: any
}

export function ClassDialog({ open, onOpenChange, classData }: ClassDialogProps) {
  const [loading, setLoading] = useState(false)
  const [academicYearId, setAcademicYearId] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    grade_level: "",
    section: "",
    capacity: "30",
    room_number: "",
  })

  useEffect(() => {
    const fetchActiveYear = async () => {
      const result = await getActiveAcademicYear()
      if (result.success && result.data) {
        setAcademicYearId(result.data.id)
      }
    }
    fetchActiveYear()
  }, [])

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || "",
        grade_level: classData.grade_level?.toString() || "",
        section: classData.section || "",
        capacity: classData.capacity?.toString() || "30",
        room_number: classData.room_number || "",
      })
    } else if (!open) {
      setFormData({
        name: "",
        grade_level: "",
        section: "",
        capacity: "30",
        room_number: "",
      })
    }
  }, [classData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academicYearId) {
      toast({ title: "Error", description: "No active academic year found", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const result = await createClass({
        name: formData.name,
        grade_level: Number.parseInt(formData.grade_level),
        section: formData.section,
        capacity: Number.parseInt(formData.capacity),
        academic_year_id: academicYearId,
        room_number: formData.room_number || undefined,
      })

      if (result.success) {
        toast({ title: "Success", description: "Class created successfully" })
        onOpenChange(false)
        window.location.reload()
      } else {
        toast({ title: "Error", description: result.error || "Failed to create class", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{classData ? "Edit Class" : "Add New Class"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Grade 1-A"
              required
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grade_level">Grade Level *</Label>
              <Input
                id="grade_level"
                type="number"
                min="1"
                max="12"
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                placeholder="1-12"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="A, B, C..."
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_number">Room Number</Label>
              <Input
                id="room_number"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                placeholder="Optional"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : classData ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
