"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { markTeacherAttendance } from "@/app/actions/teachers"
import { toast } from "@/hooks/use-toast"

interface AttendanceMarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: any
  existingAttendance?: any
}

export function AttendanceMarkDialog({ open, onOpenChange, teacher, existingAttendance }: AttendanceMarkDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: "present" as "present" | "absent" | "late" | "half_day" | "on_leave",
    check_in_time: "",
    check_out_time: "",
    remarks: "",
  })

  useEffect(() => {
    if (existingAttendance) {
      setFormData({
        status: existingAttendance.status || "present",
        check_in_time: existingAttendance.check_in_time || "",
        check_out_time: existingAttendance.check_out_time || "",
        remarks: existingAttendance.remarks || "",
      })
    } else if (!open) {
      setFormData({
        status: "present",
        check_in_time: "",
        check_out_time: "",
        remarks: "",
      })
    }
  }, [existingAttendance, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return

    setLoading(true)
    try {
      const result = await markTeacherAttendance({
        teacher_id: teacher.id,
        date: new Date().toISOString().split("T")[0],
        status: formData.status,
        check_in_time: formData.check_in_time || undefined,
        check_out_time: formData.check_out_time || undefined,
        remarks: formData.remarks || undefined,
      })

      if (result.success) {
        toast({ title: "Success", description: "Attendance marked successfully" })
        onOpenChange(false)
        window.location.reload()
      } else {
        toast({ title: "Error", description: result.error || "Failed to mark attendance", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!teacher) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Attendance - {teacher.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              disabled={loading}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check_in_time">Check In Time</Label>
              <Input
                id="check_in_time"
                type="time"
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out_time">Check Out Time</Label>
              <Input
                id="check_out_time"
                type="time"
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Optional notes"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
