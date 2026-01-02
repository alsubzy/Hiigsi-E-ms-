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
  const { error } = await supabase.from("accounts").insert(data)
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
    // Note: Transaction header is already created. 
    // In a real production environment, this should be wrapped in a database TRANSACTION (RPC).
    console.error("Critical: Failed to insert journal entries after transaction header was created.")
    throw new Error(jeError.message)
  }

  revalidatePath("/dashboard/accounting/ledger")
  return tx
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
 * INVOICING ACTIONS
 */

export async function createInvoice(data: {
  student_id: string
  fee_ids: string[]
  due_date: string
  notes?: string
}) {
  const supabase = await createClient()

  // 1. Get student fees info
  const { data: fees, error: feesError } = await supabase
    .from("student_fees")
    .select("net_amount")
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

  // 3. Link fees to invoice
  const invoiceItems = data.fee_ids.map((feeId, index) => ({
    invoice_id: invoice.id,
    student_fee_id: feeId,
    amount: fees[index].net_amount,
  }))

  const { error: itemError } = await supabase.from("invoice_items").insert(invoiceItems)
  if (itemError) throw new Error(itemError.message)

  // 4. POST TO LEDGER (Accrual Basis)
  // Debit: Accounts Receivable (1200)
  // Credit: Fee Income (linked to category or generic 4100)

  // For simplicity here, we fetch the accounts by code. 
  // In a real system, these would be configuration-driven.
  const { data: recAccount } = await supabase.from("accounts").select("id").eq("code", "1200").single()
  const { data: incAccount } = await supabase.from("accounts").select("id").eq("code", "4100").single()

  if (recAccount && incAccount) {
    await postTransaction(
      `Invoicing for ${invoice_no}`,
      "fee_assignment",
      [
        { account_id: recAccount.id, debit: totalAmount, credit: 0 },
        { account_id: incAccount.id, debit: 0, credit: totalAmount },
      ],
      invoice_no
    )
  }

  revalidatePath("/dashboard/accounting/invoices")
  return invoice
}

/**
 * PAYMENT ACTIONS
 */

export async function processPayment(data: {
  invoice_id: string
  amount: number
  payment_method: string
  bank_account_id?: string
  payment_date: string
  notes?: string
}) {
  const supabase = await createClient()

  // 1. Get Invoice & Student
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .select("student_id, invoice_no, paid_amount, total_amount")
    .eq("id", data.invoice_id)
    .single()

  if (invError) throw new Error(invError.message)

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

  // 3. Update Invoice Paid Amount & Status
  const newPaidAmount = Number(invoice.paid_amount) + Number(data.amount)
  const newStatus = newPaidAmount >= Number(invoice.total_amount) ? "paid" : "partial"

  await supabase
    .from("invoices")
    .update({ paid_amount: newPaidAmount, status: newStatus })
    .eq("id", data.invoice_id)

  // 4. POST TO LEDGER
  // Debit: Cash (1110) or Bank (linked to bank_account_id)
  // Credit: Accounts Receivable (1200)

  const { data: recAccount } = await supabase.from("accounts").select("id").eq("code", "1200").single()

  // Determine debit account
  let debitAccountId: string | undefined
  if (data.bank_account_id) {
    const { data: bank } = await supabase.from("bank_accounts").select("gl_account_id").eq("id", data.bank_account_id).single()
    debitAccountId = bank?.gl_account_id
  } else {
    const { data: cashAccount } = await supabase.from("accounts").select("id").eq("code", "1110").single()
    debitAccountId = cashAccount?.id
  }

  if (recAccount && debitAccountId) {
    await postTransaction(
      `Payment received for ${invoice.invoice_no}`,
      "payment",
      [
        { account_id: debitAccountId, debit: data.amount, credit: 0 },
        { account_id: recAccount.id, debit: 0, credit: data.amount },
      ],
      payment_no
    )
  }

  revalidatePath("/dashboard/accounting/payments")
  return payment
}

/**
 * REPORTING DATA FETCHERS
 */

export async function getTrialBalance() {
  const supabase = await createClient()
  // Complex query: Sum debits and credits per account
  const { data, error } = await supabase.rpc("get_trial_balance")
  if (error) {
    // Fallback if RPC doesn't exist yet
    return []
  }
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

  return {
    monthlyRevenue: income || 0,
    pendingAmount: receivables || 0,
    cashBalance: cash || 0,
    totalExpected: (income || 0) + (receivables || 0)
  }
}
