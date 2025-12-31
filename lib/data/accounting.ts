export interface FeeStructure {
  id: string
  grade: string
  tuitionFee: number
  transportFee: number
  activityFee: number
  examFee: number
  total: number
}

export interface Payment {
  id: string
  studentId: string
  studentName: string
  rollNumber: string
  grade: string
  section: string
  amount: number
  paymentDate: string
  paymentMethod: "cash" | "card" | "bank_transfer" | "online"
  status: "completed" | "pending" | "failed"
  feeType: string
  transactionId?: string
  remarks?: string
}

export interface StudentFeeStatus {
  studentId: string
  studentName: string
  rollNumber: string
  grade: string
  section: string
  totalFee: number
  paidAmount: number
  balance: number
  status: "paid" | "partial" | "unpaid"
  lastPaymentDate?: string
}

const feeStructures: FeeStructure[] = [
  { id: "1", grade: "Grade 9", tuitionFee: 5000, transportFee: 1000, activityFee: 500, examFee: 300, total: 6800 },
  { id: "2", grade: "Grade 10", tuitionFee: 5500, transportFee: 1000, activityFee: 500, examFee: 300, total: 7300 },
  { id: "3", grade: "Grade 11", tuitionFee: 6000, transportFee: 1000, activityFee: 500, examFee: 300, total: 7800 },
  { id: "4", grade: "Grade 12", tuitionFee: 6500, transportFee: 1000, activityFee: 500, examFee: 300, total: 8300 },
]

// Generate demo payments
function generateDemoPayments(): Payment[] {
  const students = [
    { id: "1", name: "Emma Johnson", rollNumber: "10A001", grade: "Grade 10", section: "A" },
    { id: "2", name: "Liam Smith", rollNumber: "10A002", grade: "Grade 10", section: "A" },
    { id: "3", name: "Olivia Brown", rollNumber: "9B001", grade: "Grade 9", section: "B" },
  ]

  return students.map((student, index) => ({
    id: `pay-${student.id}-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    grade: student.grade,
    section: student.section,
    amount: index === 0 ? 7300 : index === 1 ? 3650 : 0,
    paymentDate: new Date(2024, 0, 15 + index).toISOString().split("T")[0],
    paymentMethod: "bank_transfer",
    status: "completed",
    feeType: index === 0 ? "Full Payment" : "Partial Payment",
    transactionId: `TXN${1000 + index}`,
  }))
}

export function getFeeStructure(grade: string): FeeStructure | undefined {
  return feeStructures.find((f) => f.grade === grade)
}

export function getAllFeeStructures(): FeeStructure[] {
  return feeStructures
}

export function getPayments(studentId?: string, startDate?: string, endDate?: string): Payment[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("payments")
    let payments: Payment[] = stored ? JSON.parse(stored) : generateDemoPayments()

    // Save demo data if none exists
    if (!stored) {
      localStorage.setItem("payments", JSON.stringify(payments))
    }

    if (studentId) {
      payments = payments.filter((p) => p.studentId === studentId)
    }

    if (startDate) {
      payments = payments.filter((p) => p.paymentDate >= startDate)
    }

    if (endDate) {
      payments = payments.filter((p) => p.paymentDate <= endDate)
    }

    return payments
  }
  return []
}

export function addPayment(payment: Omit<Payment, "id">): Payment {
  const payments = getPayments()
  const newPayment = {
    ...payment,
    id: `pay-${Date.now()}`,
  }
  payments.push(newPayment)

  if (typeof window !== "undefined") {
    localStorage.setItem("payments", JSON.stringify(payments))
  }

  return newPayment
}

export function getStudentFeeStatus(): StudentFeeStatus[] {
  if (typeof window !== "undefined") {
    const students = require("./students").getStudents()
    const payments = getPayments()

    return students.map((student: any) => {
      const feeStructure = getFeeStructure(student.grade)
      const totalFee = feeStructure?.total || 0

      const studentPayments = payments.filter((p) => p.studentId === student.id && p.status === "completed")
      const paidAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0)
      const balance = totalFee - paidAmount

      const lastPayment = studentPayments.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0]

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        grade: student.grade,
        section: student.section,
        totalFee,
        paidAmount,
        balance,
        status: balance <= 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
        lastPaymentDate: lastPayment?.paymentDate,
      }
    })
  }
  return []
}

export function getFinancialSummary(startDate?: string, endDate?: string) {
  const payments = getPayments(undefined, startDate, endDate)

  const totalRevenue = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)

  const pendingAmount = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)

  const paymentsByMethod = payments
    .filter((p) => p.status === "completed")
    .reduce(
      (acc, p) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount
        return acc
      },
      {} as Record<string, number>,
    )

  return {
    totalRevenue,
    pendingAmount,
    completedPayments: payments.filter((p) => p.status === "completed").length,
    pendingPayments: payments.filter((p) => p.status === "pending").length,
    paymentsByMethod,
  }
}
