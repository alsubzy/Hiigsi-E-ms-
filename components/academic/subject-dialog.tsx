"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSubject } from "@/app/actions/academic"
import { toast } from "@/hooks/use-toast"

interface SubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectData?: any
}

export function SubjectDialog({ open, onOpenChange, subjectData }: SubjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    credits: "1",
  })

  useEffect(() => {
    if (subjectData) {
      setFormData({
        name: subjectData.name || "",
        code: subjectData.code || "",
        description: subjectData.description || "",
        credits: subjectData.credits?.toString() || "1",
      })
    } else if (!open) {
      setFormData({
        name: "",
        code: "",
        description: "",
        credits: "1",
      })
    }
  }, [subjectData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createSubject({
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description || undefined,
        credits: Number.parseInt(formData.credits),
      })

      if (result.success) {
        toast({ title: "Success", description: "Subject created successfully" })
        onOpenChange(false)
        window.location.reload()
      } else {
        toast({ title: "Error", description: result.error || "Failed to create subject", variant: "destructive" })
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
          <DialogTitle>{subjectData ? "Edit Subject" : "Add New Subject"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mathematics"
              required
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Subject Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., MATH"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits *</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
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
              {loading ? "Saving..." : subjectData ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
