export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  rollNumber: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  grade: string
  section: string
  notes?: string
}

export interface AttendanceSummary {
  date: string
  grade: string
  section: string
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
}

// Generate demo attendance data for today
function generateDemoAttendance(): AttendanceRecord[] {
  const today = new Date().toISOString().split("T")[0]
  const students = [
    { id: "1", name: "Emma Johnson", rollNumber: "10A001", grade: "Grade 10", section: "A" },
    { id: "2", name: "Liam Smith", rollNumber: "10A002", grade: "Grade 10", section: "A" },
    { id: "3", name: "Olivia Brown", rollNumber: "9B001", grade: "Grade 9", section: "B" },
    { id: "4", name: "Noah Davis", rollNumber: "11A001", grade: "Grade 11", section: "A" },
    { id: "5", name: "Ava Wilson", rollNumber: "9A001", grade: "Grade 9", section: "A" },
    { id: "6", name: "Sophia Martinez", rollNumber: "12A001", grade: "Grade 12", section: "A" },
  ]

  return students.map((student, index) => ({
    id: `${today}-${student.id}`,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    date: today,
    status: index % 4 === 0 ? "absent" : index % 5 === 0 ? "late" : "present",
    grade: student.grade,
    section: student.section,
  }))
}

export function getAttendanceRecords(date?: string, grade?: string, section?: string): AttendanceRecord[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("attendance")
    let records: AttendanceRecord[] = stored ? JSON.parse(stored) : generateDemoAttendance()

    // Save demo data if none exists
    if (!stored) {
      localStorage.setItem("attendance", JSON.stringify(records))
    }

    // Filter by date
    if (date) {
      records = records.filter((r) => r.date === date)
    }

    // Filter by grade
    if (grade) {
      records = records.filter((r) => r.grade === grade)
    }

    // Filter by section
    if (section) {
      records = records.filter((r) => r.section === section)
    }

    return records
  }
  return []
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  if (typeof window !== "undefined") {
    const existing = getAttendanceRecords()
    // Remove old records for the same date/students
    const filtered = existing.filter((e) => !records.some((r) => r.date === e.date && r.studentId === e.studentId))
    const updated = [...filtered, ...records]
    localStorage.setItem("attendance", JSON.stringify(updated))
  }
}

export function getAttendanceSummary(date: string): AttendanceSummary[] {
  const records = getAttendanceRecords(date)

  // Group by grade and section
  const grouped = records.reduce(
    (acc, record) => {
      const key = `${record.grade}-${record.section}`
      if (!acc[key]) {
        acc[key] = {
          date,
          grade: record.grade,
          section: record.section,
          totalStudents: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        }
      }
      acc[key].totalStudents++
      acc[key][record.status]++
      return acc
    },
    {} as Record<string, AttendanceSummary>,
  )

  return Object.values(grouped)
}
