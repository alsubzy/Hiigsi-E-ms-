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

export async function updateAccount(id: string, data: {
  name: string
  code: string
  type: "asset" | "liability" | "equity" | "income" | "expense"
  parent_id?: string | null
  description?: string | null
  is_active?: boolean
}) {
  const supabase = await createClient()
  const { error } = await supabase.from("accounts").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/accounting/coa")
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()

  // 1. Check for journal entries (dependencies)
  const { count, error: countError } = await supabase
    .from("journal_entries")
    .select("*", { count: 'exact', head: true })
    .eq("account_id", id)

  if (countError) throw new Error(countError.message)
  if (count && count > 0) {
    throw new Error("Cannot delete account with existing transactions. Deactivate it instead.")
  }

  // 2. Check for child accounts
  const { count: childCount } = await supabase
    .from("accounts")
    .select("*", { count: 'exact', head: true })
    .eq("parent_id", id)

  if (childCount && childCount > 0) {
    throw new Error("Cannot delete account with sub-accounts.")
  }

  const { error } = await supabase.from("accounts").delete().eq("id", id)
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
  return data || []
}

export async function getAcademicYears() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("academic_years").select("*").order("name", { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getTerms(academicYearId?: string) {
  const supabase = await createClient()

  let yearId = academicYearId
  if (!yearId) {
    // Try to find current year logic. Robust to schema drift (is_current vs is_active)
    // We'll fetch the latest academic year by name as a safe fallback
    const { data: latestYear } = await supabase
      .from("academic_years")
      .select("id")
      .order("name", { ascending: false })
      .limit(1)
      .maybeSingle()

    yearId = latestYear?.id
  }

  if (!yearId) return []

  const { data, error } = await supabase
    .from("terms")
    .select("*")
    .eq("academic_year_id", yearId)
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getFeeStructures() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("fee_structures")
    .select("*, fee_categories(*), academic_years(*), terms(*), classes(*)")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// Helper to validate common IDs
async function validateFeeStructureDependencies(supabase: any, data: { academic_year_id: string, term_id: string, class_id: string, fee_category_id: string }) {
  // 1. Validate Academic Year
  const { data: year } = await supabase.from("academic_years").select("id").eq("id", data.academic_year_id).single()
  if (!year) throw new Error("Invalid Academic Year selected.")

  // 2. Validate Term
  const { data: term } = await supabase.from("terms").select("id").eq("id", data.term_id).single()
  if (!term) throw new Error("Invalid Term selected.")

  // 3. Validate Category
  const { data: cat } = await supabase.from("fee_categories").select("id").eq("id", data.fee_category_id).single()
  if (!cat) throw new Error("Invalid Fee Category selected.")

  // 4. Validate Class (CRITICAL: User requirement)
  const { data: cls } = await supabase.from("classes").select("id").eq("id", data.class_id).maybeSingle()
  if (!cls) {
    throw new Error(`Invalid Class selected. Class ID '${data.class_id}' does not exist in the Classes table.`)
  }
}

export async function createFeeStructure(data: {
  fee_category_id: string
  academic_year_id: string
  term_id: string
  class_id: string
  amount: number
  is_mandatory?: boolean
  due_date?: string
}) {
  const supabase = await createClient()

  try {
    await validateFeeStructureDependencies(supabase, data)

    const { error } = await supabase.from("fee_structures").insert({
      fee_category_id: data.fee_category_id,
      academic_year_id: data.academic_year_id,
      term_id: data.term_id,
      class_id: data.class_id,
      amount: data.amount,
      is_mandatory: data.is_mandatory,
      due_date: data.due_date
    })

    if (error) {
      if (error.code === '23505') throw new Error("A fee structure for this Category, Class, Year, and Term already exists.")
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/accounting/structures")
    return { success: true }
  } catch (error: any) {
    console.error("Create Fee Structure Error:", error)
    return { success: false, message: error.message }
  }
}

export async function updateFeeStructure(id: string, data: {
  fee_category_id: string
  academic_year_id: string
  term_id: string
  class_id: string
  amount: number
  is_mandatory?: boolean
  due_date?: string
}) {
  const supabase = await createClient()

  try {
    await validateFeeStructureDependencies(supabase, data)

    const { error } = await supabase.from("fee_structures").update({
      fee_category_id: data.fee_category_id,
      academic_year_id: data.academic_year_id,
      term_id: data.term_id,
      class_id: data.class_id,
      amount: data.amount,
      is_mandatory: data.is_mandatory,
      due_date: data.due_date
    }).eq("id", id)

    if (error) throw new Error(error.message)

    revalidatePath("/dashboard/accounting/structures")
    return { success: true }
  } catch (error: any) {
    console.error("Update Fee Structure Error:", error)
    return { success: false, message: error.message }
  }
}

export async function deleteFeeStructure(id: string) {
  const supabase = await createClient()

  // Check for dependencies (student fees)
  const { count, error: countError } = await supabase
    .from("student_fees")
    .select("*", { count: 'exact', head: true })
    .eq("fee_structure_id", id)

  if (countError) throw new Error(countError.message)
  if (count && count > 0) {
    throw new Error("Cannot delete fee structure that is assigned to students. Deactivate it instead.")
  }

  const { error } = await supabase.from("fee_structures").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/accounting/structures")
}

export async function getStudentFees(studentId?: string) {
  const supabase = await createClient()
  let query = supabase.from("student_fees").select("*, fee_structures(*, fee_categories(*)), students(*)")
  if (studentId) query = query.eq("student_id", studentId)
  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function assignFeesToStudents(data: {
  studentIds: string[]
  feeStructureId: string
  discount_amount?: number
  discount_reason?: string
}) {
  const supabase = await createClient()

  // 1. Get Fee Structure Details
  const { data: fs, error: fsError } = await supabase
    .from("fee_structures")
    .select("*")
    .eq("id", data.feeStructureId)
    .single()

  if (fsError) throw new Error(fsError.message)

  // 2. Prepare Assignments
  const assignments = data.studentIds.map(stId => ({
    student_id: stId,
    fee_structure_id: data.feeStructureId,
    amount: fs.amount,
    academic_year_id: fs.academic_year_id,
    term_id: fs.term_id,
    discount_amount: data.discount_amount || 0,
    discount_reason: data.discount_reason || "",
    status: 'pending'
  }))

  // 3. Insert (using upsert or just insert - let's use insert but we might want to check for duplicates in UI)
  // To avoid duplicates, we can use a unique constraint in DB (which exists: student_id, fee_structure_id)
  // But our schema only has Category/Year/Grade/Term unique.
  // Actually, we should probably add a unique constraint on (student_id, fee_structure_id) in DB or check here.

  const { error } = await supabase.from("student_fees").insert(assignments)
  if (error) {
    if (error.code === '23505') throw new Error("Some students already have this fee assigned.")
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/accounting/fees")
}

export async function updateStudentFee(id: string, data: {
  discount_amount?: number
  late_fee_amount?: number
  discount_reason?: string
  status?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from("student_fees").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/accounting/fees")
}

export async function deleteStudentFee(id: string) {
  const supabase = await createClient()

  // 1. Check if linked to invoice
  const { count, error: countError } = await supabase
    .from("invoice_items")
    .select("*", { count: 'exact', head: true })
    .eq("student_fee_id", id)

  if (countError) throw new Error(countError.message)
  if (count && count > 0) {
    throw new Error("Cannot delete fee that is already linked to an invoice.")
  }

  // 2. Delete
  const { error } = await supabase.from("student_fees").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/accounting/fees")
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
      // balance_amount is GENERATED ALWAYS AS (total_amount - paid_amount) STORED
      // paid_amount defaults to 0, so balance will initially equal total
      due_date: data.due_date,
      notes: data.notes,
      status: "unpaid"
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

  // 4. Update fees to 'partial' or 'invoiced' if we had such status, 
  // currently we just link them.

  revalidatePath("/dashboard/accounting/invoices")
  return invoice
}

export async function updateInvoice(id: string, data: {
  due_date?: string
  notes?: string
  status?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from("invoices").update(data).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/accounting/invoices")
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()

  // 1. Check for payments
  const { count, error: countError } = await supabase
    .from("accounting_payments")
    .select("*", { count: 'exact', head: true })
    .eq("invoice_id", id)

  if (countError) throw new Error(countError.message)
  if (count && count > 0) {
    throw new Error("Cannot delete invoice with existing payments. Cancel it instead.")
  }

  // 2. Delete items (should be cascade, but let's be safe if not)
  await supabase.from("invoice_items").delete().eq("invoice_id", id)

  // 3. Delete invoice
  const { error } = await supabase.from("invoices").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidatePath("/dashboard/accounting/invoices")
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

  // 1. Get Invoice & Verify Balance
  console.log("[processPayment] Starting with invoice_id:", data.invoice_id)

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("student_id, invoice_no, paid_amount, total_amount")
    .eq("id", data.invoice_id)
    .single()

  if (fetchError) {
    console.error("[processPayment] Fetch Error:", fetchError)
    throw new Error(`Invoice lookup failed: ${fetchError.message}`)
  }

  if (!invoice) {
    console.error("[processPayment] No invoice found for ID:", data.invoice_id)
    throw new Error("Invoice not found")
  }

  console.log("[processPayment] Found invoice:", invoice.invoice_no, "Current Paid:", invoice.paid_amount)

  const currentBalance = Number(invoice.total_amount) - Number(invoice.paid_amount)
  if (data.amount > currentBalance) {
    throw new Error(`Overpayment detected. Maximum payable amount is $${currentBalance.toLocaleString()}`)
  }

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

  // 4. Update Student Fee Statuses (simplified allocation to oldest linked fees first)
  const { data: invItems } = await supabase
    .from("invoice_items")
    .select("student_fee_id, amount")
    .eq("invoice_id", data.invoice_id)

  if (invItems) {
    for (const item of invItems) {
      // If payment >= invoice total, all are paid. For simplicity in this version,
      // we mark all as paid if the invoice is paid.
      if (newStatus === "paid") {
        await supabase.from("student_fees").update({ status: "paid" }).eq("id", item.student_fee_id)
      } else if (newStatus === "partial") {
        await supabase.from("student_fees").update({ status: "partial" }).eq("id", item.student_fee_id)
      }
    }
  }

  revalidatePath("/dashboard/accounting/collection")
  revalidatePath("/dashboard/accounting/invoices")
  return payment
}

export async function reversePayment(paymentId: string, reason: string) {
  const supabase = await createClient()

  // 1. Get Payment & Invoice
  const { data: payment } = await supabase
    .from("accounting_payments")
    .select("amount, invoice_id, payment_no")
    .eq("id", paymentId)
    .single()

  if (!payment) throw new Error("Payment not found")

  // 2. Get Invoice current state
  const { data: invoice } = await supabase
    .from("invoices")
    .select("paid_amount, total_amount")
    .eq("id", payment.invoice_id)
    .single()

  if (!invoice) throw new Error("Linked invoice not found")

  // 3. Revert Invoice Amounts
  const revertedPaidAmount = Math.max(0, Number(invoice.paid_amount) - Number(payment.amount))
  const revertedStatus = revertedPaidAmount === 0 ? "unpaid" : "partial"

  const { error: invUpdateError } = await supabase
    .from("invoices")
    .update({
      paid_amount: revertedPaidAmount,
      status: revertedStatus
    })
    .eq("id", payment.invoice_id)

  if (invUpdateError) throw new Error("Failed to revert invoice balance")

  // 4. Delete/Void Payment
  // Actually, we should probably keep it and mark as 'reversed' if we had a status, 
  // but based on current schema we will delete it or let the user choose.
  // We'll delete for now to simplify UI but ideally we'd have a 'voided' status.
  const { error: payDeleteError } = await supabase
    .from("accounting_payments")
    .delete()
    .eq("id", paymentId)

  if (payDeleteError) throw new Error("Failed to remove payment record")

  // 5. TODO: GL Reversal Entries
  // Since triggers automaticly post, we'd need to post a negative entry or 
  // delete the created transaction. Triggers usually handle INSERT only.
  // Based on 019_accounting_auto_posting.sql, triggers are on INSERT.
  // We should manually create a reversing transaction here or delete the original tx.
  // For now we revalidate to refresh UI.

  revalidatePath("/dashboard/accounting/collection")
  revalidatePath("/dashboard/accounting/invoices")

  return { success: true }
}

export async function getPaymentDetails(paymentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("accounting_payments")
    .select(`
            *,
            students (first_name, last_name, student_id, sections(name, classes(name))),
            invoices (
                invoice_no, 
                invoice_items (
                    amount,
                    student_fees (
                        fee_structures (name)
                    )
                )
            ),
            users_collected: collected_by (full_name) 
        `) // Assuming 'collected_by' relates to profiles/users
    .eq("id", paymentId)
    .single()

  if (error) return null // Handle specific errors if needed
  return data
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
