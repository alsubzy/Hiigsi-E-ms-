"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * CHART OF ACCOUNTS (COA) ACTIONS
 */

export async function getAccounts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("code", { ascending: true })

  if (error) {
    if (error.message.includes("Could not find the table")) {
      throw new Error("Accounting tables not found. Please run the SQL scripts in the 'scripts' folder (starting with 015) in your Supabase SQL Editor.")
    }
    throw new Error(error.message)
  }
  return data
}

export async function createAccount(data: {
  name: string
  code: string
  type: "asset" | "liability" | "equity" | "income" | "expense"
  parent_id?: string
  description?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from("accounts").insert({ ...data, is_active: true })
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/accounting/coa")
}

/**
 * GENERAL LEDGER ENGINE
 * This is the core function for double-entry bookkeeping.
 */

interface JournalEntryLine {
  account_id: string
  debit: number
  credit: number
  notes?: string
}

export async function postTransaction(
  description: string,
  type: string,
  lines: JournalEntryLine[],
  reference_no?: string,
  date: string = new Date().toISOString().split("T")[0],
) {
  const supabase = await createClient()

  // 1. Validate balanced transaction
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0)

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Transaction must balance. Debits ($${totalDebit}) != Credits ($${totalCredit})`)
  }

  // 2. Get current academic year
  const { data: ay } = await supabase.from("academic_years").select("id").eq("is_current", true).single()

  // 3. Create Transaction Header
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .insert({
      description,
      type,
      reference_no,
      date,
      academic_year_id: ay?.id,
    })
    .select()
    .single()

  if (txError) throw new Error(txError.message)

  // 4. Create Journal Entries
  const journalEntries = lines.map((line) => ({
    transaction_id: tx.id,
    account_id: line.account_id,
    debit: line.debit,
    credit: line.credit,
    notes: line.notes,
  }))

  const { error: jeError } = await supabase.from("journal_entries").insert(journalEntries)

  if (jeError) {
    console.error("Failed to insert journal entries:", jeError)
    throw new Error(jeError.message)
  }

  revalidatePath("/dashboard/accounting/ledger")
  return tx
}

/**
 * EXPENSE & INCOME ACTIONS
 */

export async function recordExpense(data: {
  account_id: string // The expense GL account
  amount: number
  vendor: string
  payment_method: string
  bank_account_id?: string
  description: string
  date: string
}) {
  const supabase = await createClient()
  const expense_no = `EXP-${Date.now()}`

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      ...data,
      expense_no,
      status: "paid"
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/accounting/expenses")
  return expense
}

export async function recordOtherIncome(data: {
  account_id: string // The income GL account
  amount: number
  source: string
  payment_method: string
  bank_account_id?: string
  description: string
  date: string
}) {
  const supabase = await createClient()
  const income_no = `INC-${Date.now()}`

  const { data: income, error } = await supabase
    .from("other_incomes")
    .insert({
      ...data,
      income_no
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/accounting/income")
  return income
}

/**
 * FEE MANAGEMENT ACTIONS
 */

export async function getFeeCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("fee_categories").select("*, accounts(*)")
  if (error) throw new Error(error.message)
  return data
}

export async function getStudentFees(studentId?: string) {
  const supabase = await createClient()
  let query = supabase.from("student_fees").select("*, fee_structures(*, fee_categories(*)), students(*)")
  if (studentId) query = query.eq("student_id", studentId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

/**
 * INVOICING & PAYMENTS
 */

export async function createInvoice(data: {
  student_id: string
  fee_ids: string[]
  due_date: string
  notes?: string
}) {
  const supabase = await createClient()

  // 1. Get net amounts from fees
  const { data: fees, error: feesError } = await supabase
    .from("student_fees")
    .select("net_amount, id")
    .in("id", data.fee_ids)

  if (feesError) throw new Error(feesError.message)

  const totalAmount = fees.reduce((sum, fee) => sum + Number(fee.net_amount), 0)

  // 2. Create Invoice
  const invoice_no = `INV-${Date.now()}`
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .insert({
      invoice_no,
      student_id: data.student_id,
      total_amount: totalAmount,
      due_date: data.due_date,
      notes: data.notes,
    })
    .select()
    .single()

  if (invError) throw new Error(invError.message)

  // 3. Link items
  const invoiceItems = fees.map((f) => ({
    invoice_id: invoice.id,
    student_fee_id: f.id,
    amount: f.net_amount,
  }))

  await supabase.from("invoice_items").insert(invoiceItems)

  revalidatePath("/dashboard/accounting/invoices")
  return invoice
}

export async function processPayment(data: {
  invoice_id: string
  amount: number
  payment_method: string
  bank_account_id?: string
  payment_date: string
  notes?: string
}) {
  const supabase = await createClient()

  // 1. Get Invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select("student_id, invoice_no, paid_amount, total_amount")
    .eq("id", data.invoice_id)
    .single()

  if (!invoice) throw new Error("Invoice not found")

  // 2. Create Payment Record
  const payment_no = `PAY-${Date.now()}`
  const { data: payment, error: payError } = await supabase
    .from("accounting_payments")
    .insert({
      payment_no,
      invoice_id: data.invoice_id,
      student_id: invoice.student_id,
      amount: data.amount,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      bank_account_id: data.bank_account_id,
      notes: data.notes,
    })
    .select()
    .single()

  if (payError) throw new Error(payError.message)

  // 3. Update Invoice Status
  const newPaidAmount = Number(invoice.paid_amount) + Number(data.amount)
  const newStatus = newPaidAmount >= Number(invoice.total_amount) ? "paid" : "partial"

  await supabase
    .from("invoices")
    .update({ paid_amount: newPaidAmount, status: newStatus })
    .eq("id", data.invoice_id)

  revalidatePath("/dashboard/accounting/payments")
  revalidatePath("/dashboard/accounting/invoices")
  return payment
}

/**
 * AUDIT LOGS
 */

export async function getAuditLogs(limit = 100) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("accounting_audit_logs")
    .select("*, auth.users(email)")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data
}

/**
 * REPORTING DATA FETCHERS
 */

export async function getTrialBalance() {
  const supabase = await createClient()
  // Complex query: Sum debits and credits per account
  const { data, error } = await supabase.rpc("get_trial_balance")
  if (error) return []
  return data
}

export async function getAccountingStats() {
  const supabase = await createClient()

  // Total Revenue (Income accounts sum)
  const { data: income } = await supabase.rpc("get_total_revenue")

  // Outstanding Receivables
  const { data: receivables } = await supabase.rpc("get_total_receivables")

  // Cash Balance
  const { data: cash } = await supabase.rpc("get_cash_balance")

  // Recent Transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .limit(10)

  return {
    monthlyRevenue: income || 0,
    pendingAmount: receivables || 0,
    cashBalance: cash || 0,
    totalExpected: (income || 0) + (receivables || 0),
    recentTransactions: recentTransactions || []
  }
}
