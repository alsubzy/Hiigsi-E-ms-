export interface Profile {
  id: string
  email: string
  full_name: string
  role: "admin" | "teacher" | "accountant" | "staff"
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  roll_number: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: "male" | "female" | "other"
  email?: string
  phone?: string
  address?: string
  section_id: string  // UUID reference to sections table
  section?: {  // Optional joined data
    id: string
    name: string
    class_id: string
    class?: {
      id: string
      name: string
      level: number
    }
  }
  admission_date: string
  parent_name: string
  parent_phone: string
  parent_email?: string
  blood_group?: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string
  marked_by?: string
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  class_id: string  // UUID reference to classes table
  class?: {  // Optional joined data
    id: string
    name: string
  }
  created_at: string
}

export interface Mark {
  id: string
  student_id: string
  subject_id: string
  term: string
  marks: number
  result?: string
  remarks?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  student_id: string
  amount: number
  fee_type: string
  payment_method: "cash" | "card" | "bank_transfer" | "cheque" | "online"
  transaction_id?: string
  payment_date: string
  status: "completed" | "pending" | "failed"
  notes?: string
  recorded_by?: string
  created_at: string
  updated_at: string
}

export interface FeeStructure {
  id: string
  class_id: string  // UUID reference to classes table
  class?: {  // Optional joined data
    id: string
    name: string
  }
  fee_type: string
  amount: number
  frequency: "monthly" | "quarterly" | "yearly" | "one-time"
  created_at: string
}
