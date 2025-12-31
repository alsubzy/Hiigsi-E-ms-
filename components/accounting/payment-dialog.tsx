"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { recordPayment } from "@/app/actions/accounting"
import { toast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
  roll_number: string
  grade: string
  section: string
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student
  onSuccess: () => void
}

export function PaymentDialog({ open, onOpenChange, student, onSuccess }: PaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash" as "cash" | "card" | "bank_transfer" | "online" | "cheque",
    fee_type: "tuition",
    transaction_id: "",
    remarks: "",
  })

  useEffect(() => {
    if (!open) {
      setFormData({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        fee_type: "tuition",
        transaction_id: "",
        remarks: "",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    setLoading(true)
    try {
      const result = await recordPayment({
        student_id: student.id,
        amount: Number.parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        fee_type: formData.fee_type,
        transaction_id: formData.transaction_id || undefined,
        remarks: formData.remarks || undefined,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Payment recorded successfully",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to record payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <p className="text-sm font-medium">
              {student.name} ({student.roll_number}) - Grade {student.grade}
              {student.section}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleChange("payment_date", e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleChange("payment_method", value)}
                disabled={loading}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee_type">Fee Type *</Label>
              <Select
                value={formData.fee_type}
                onValueChange={(value) => handleChange("fee_type", value)}
                disabled={loading}
              >
                <SelectTrigger id="fee_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tuition">Tuition Fee</SelectItem>
                  <SelectItem value="transport">Transport Fee</SelectItem>
                  <SelectItem value="activity">Activity Fee</SelectItem>
                  <SelectItem value="exam">Exam Fee</SelectItem>
                  <SelectItem value="library">Library Fee</SelectItem>
                  <SelectItem value="laboratory">Laboratory Fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_id">Transaction ID</Label>
            <Input
              id="transaction_id"
              value={formData.transaction_id}
              onChange={(e) => handleChange("transaction_id", e.target.value)}
              placeholder="Optional"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
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
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
