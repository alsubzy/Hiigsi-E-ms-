"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCalendarEvent, getActiveAcademicYear } from "@/app/actions/academic"
import { toast } from "@/hooks/use-toast"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventData?: any
}

export function EventDialog({ open, onOpenChange, eventData }: EventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [academicYearId, setAcademicYearId] = useState<string>("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "event",
    start_date: "",
    end_date: "",
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
    if (eventData) {
      setFormData({
        title: eventData.title || "",
        description: eventData.description || "",
        event_type: eventData.event_type || "event",
        start_date: eventData.start_date || "",
        end_date: eventData.end_date || "",
      })
    } else if (!open) {
      setFormData({
        title: "",
        description: "",
        event_type: "event",
        start_date: "",
        end_date: "",
      })
    }
  }, [eventData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academicYearId) {
      toast({ title: "Error", description: "No active academic year found", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const result = await createCalendarEvent({
        title: formData.title,
        description: formData.description || undefined,
        event_type: formData.event_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        academic_year_id: academicYearId,
      })

      if (result.success) {
        toast({ title: "Success", description: "Event created successfully" })
        onOpenChange(false)
        window.location.reload()
      } else {
        toast({ title: "Error", description: result.error || "Failed to create event", variant: "destructive" })
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
          <DialogTitle>{eventData ? "Edit Event" : "Add Calendar Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Winter Break"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type *</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              disabled={loading}
            >
              <SelectTrigger id="event_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : eventData ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
