"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTimetableEntry } from "@/app/actions/academic"
import { toast } from "@/hooks/use-toast"

interface TimetableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classes: any[]
  subjects: any[]
}

export function TimetableDialog({ open, onOpenChange, classes, subjects }: TimetableDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    class_id: "",
    subject_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    room_number: "",
  })

  useEffect(() => {
    if (!open) {
      setFormData({
        class_id: "",
        subject_id: "",
        day_of_week: "",
        start_time: "",
        end_time: "",
        room_number: "",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createTimetableEntry({
        class_id: formData.class_id,
        subject_id: formData.subject_id,
        day_of_week: Number.parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        room_number: formData.room_number || undefined,
      })

      if (result.success) {
        toast({ title: "Success", description: "Timetable entry created successfully" })
        onOpenChange(false)
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create timetable entry",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const daysOfWeek = [
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
    { value: "7", label: "Sunday" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Timetable Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class_id">Class *</Label>
            <Select
              value={formData.class_id}
              onValueChange={(value) => setFormData({ ...formData, class_id: value })}
              disabled={loading}
            >
              <SelectTrigger id="class_id">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject_id">Subject *</Label>
            <Select
              value={formData.subject_id}
              onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
              disabled={loading}
            >
              <SelectTrigger id="subject_id">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="day_of_week">Day of Week *</Label>
            <Select
              value={formData.day_of_week}
              onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
              disabled={loading}
            >
              <SelectTrigger id="day_of_week">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                disabled={loading}
              />
            </div>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
