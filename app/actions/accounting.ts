"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getPayments(studentId?: string, startDate?: string, endDate?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("payments")
    .select(
      `
      *,
      students:student_id (*)
    `,
    )
    .order("payment_date", { ascending: false })

  if (studentId) {
    query = query.eq("student_id", studentId)
  }

  if (startDate) {
    query = query.gte("payment_date", startDate)
  }

  if (endDate) {
    query = query.lte("payment_date", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching payments:", error)
    return []
  }

  return data
}

export async function createPayment(paymentData: {
  student_id: string
  amount: number
  fee_type: string
  payment_method: string
  transaction_id?: string
  payment_date: string
  notes?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("payments")
    .insert({
      ...paymentData,
      status: "completed",
      recorded_by: user.id,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating payment:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/accounting")
  return data
}

export async function getFeeStructure() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("fee_structure").select("*").order("grade")

  if (error) {
    console.error("Error fetching fee structure:", error)
    return []
  }

  return data
}

export async function getStudentFeeStatus() {
  const supabase = await createClient()

  // Get all active students
  const { data: students } = await supabase.from("students").select("*").eq("status", "active")

  if (!students) return []

  // Get current month date range
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)

  // Get payments for current month
  const { data: payments } = await supabase
    .from("payments")
    .select("student_id, amount")
    .gte("payment_date", `${currentMonth}-01`)
    .eq("status", "completed")

  // Calculate fee status for each student
  const feeStatus = await Promise.all(
    students.map(async (student) => {
      const { data: feeStructure } = await supabase
        .from("fee_structure")
        .select("amount")
        .eq("grade", student.grade)
        .eq("frequency", "monthly")

      const totalDue = feeStructure?.reduce((sum, f) => sum + Number(f.amount), 0) || 0

      const studentPayments = payments?.filter((p) => p.student_id === student.id) || []
      const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount), 0)

      const balance = totalDue - totalPaid

      return {
        student,
        totalDue,
        totalPaid,
        balance,
        status: balance <= 0 ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
      }
    }),
  )

  return feeStatus
}

export async function getAccountingStats() {
  const supabase = await createClient()

  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const currentYear = now.getFullYear().toString()

  // Monthly revenue
  const { data: monthlyPayments } = await supabase
    .from("payments")
    .select("amount")
    .gte("payment_date", `${currentMonth}-01`)
    .eq("status", "completed")

  const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Yearly revenue
  const { data: yearlyPayments } = await supabase
    .from("payments")
    .select("amount")
    .gte("payment_date", `${currentYear}-01-01`)
    .eq("status", "completed")

  const yearlyRevenue = yearlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Pending amount
  const { data: students } = await supabase.from("students").select("grade").eq("status", "active")

  let totalExpected = 0
  if (students) {
    for (const student of students) {
      const { data: feeStructure } = await supabase
        .from("fee_structure")
        .select("amount")
        .eq("grade", student.grade)
        .eq("frequency", "monthly")

      const studentFee = feeStructure?.reduce((sum, f) => sum + Number(f.amount), 0) || 0
      totalExpected += studentFee
    }
  }

  const pendingAmount = totalExpected - monthlyRevenue

  return {
    monthlyRevenue,
    yearlyRevenue,
    pendingAmount,
    totalExpected,
  }
}

export async function recordPayment(paymentData: {
  student_id: string
  amount: number
  payment_date: string
  payment_method: "cash" | "card" | "bank_transfer" | "online" | "cheque"
  fee_type: string
  transaction_id?: string
  remarks?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("payments")
    .insert([
      {
        student_id: paymentData.student_id,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        fee_type: paymentData.fee_type,
        transaction_id: paymentData.transaction_id,
        remarks: paymentData.remarks,
        status: "completed",
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error recording payment:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/accounting")
  return { success: true, data }
}
