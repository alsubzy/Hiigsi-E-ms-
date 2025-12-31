export interface Grade {
  id: string
  studentId: string
  studentName: string
  rollNumber: string
  grade: string
  section: string
  subject: string
  term: string
  score: number
  maxScore: number
  remarks?: string
}

export interface ReportCard {
  studentId: string
  studentName: string
  rollNumber: string
  grade: string
  section: string
  term: string
  subjects: {
    subject: string
    score: number
    maxScore: number
    percentage: number
    grade: string
    remarks?: string
  }[]
  totalScore: number
  totalMaxScore: number
  percentage: number
  overallGrade: string
  position?: number
}

const subjects = ["Mathematics", "English", "Science", "Social Studies", "Computer Science"]

const terms = ["Term 1", "Term 2", "Term 3", "Final"]

// Generate demo grades
function generateDemoGrades(): Grade[] {
  const students = [
    { id: "1", name: "Emma Johnson", rollNumber: "10A001", grade: "Grade 10", section: "A" },
    { id: "2", name: "Liam Smith", rollNumber: "10A002", grade: "Grade 10", section: "A" },
  ]

  const grades: Grade[] = []
  students.forEach((student) => {
    subjects.forEach((subject) => {
      const score = Math.floor(Math.random() * 30) + 70 // Random score 70-100
      grades.push({
        id: `${student.id}-${subject}-term1`,
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        grade: student.grade,
        section: student.section,
        subject,
        term: "Term 1",
        score,
        maxScore: 100,
        remarks: score >= 90 ? "Excellent" : score >= 75 ? "Good" : "Needs Improvement",
      })
    })
  })

  return grades
}

export function getGrades(studentId?: string, term?: string, gradeLevel?: string, section?: string): Grade[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("grades")
    let grades: Grade[] = stored ? JSON.parse(stored) : generateDemoGrades()

    // Save demo data if none exists
    if (!stored) {
      localStorage.setItem("grades", JSON.stringify(grades))
    }

    if (studentId) {
      grades = grades.filter((g) => g.studentId === studentId)
    }

    if (term) {
      grades = grades.filter((g) => g.term === term)
    }

    if (gradeLevel) {
      grades = grades.filter((g) => g.grade === gradeLevel)
    }

    if (section) {
      grades = grades.filter((g) => g.section === section)
    }

    return grades
  }
  return []
}

export function saveGrade(grade: Grade): void {
  if (typeof window !== "undefined") {
    const grades = getGrades()
    const index = grades.findIndex((g) => g.id === grade.id)

    if (index !== -1) {
      grades[index] = grade
    } else {
      grades.push(grade)
    }

    localStorage.setItem("grades", JSON.stringify(grades))
  }
}

export function saveGrades(newGrades: Grade[]): void {
  if (typeof window !== "undefined") {
    const existing = getGrades()
    const filtered = existing.filter(
      (e) => !newGrades.some((n) => n.studentId === e.studentId && n.subject === e.subject && n.term === e.term),
    )
    const updated = [...filtered, ...newGrades]
    localStorage.setItem("grades", JSON.stringify(updated))
  }
}

export function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return "A+"
  if (percentage >= 85) return "A"
  if (percentage >= 80) return "A-"
  if (percentage >= 75) return "B+"
  if (percentage >= 70) return "B"
  if (percentage >= 65) return "B-"
  if (percentage >= 60) return "C+"
  if (percentage >= 55) return "C"
  if (percentage >= 50) return "C-"
  return "F"
}

export function generateReportCard(studentId: string, term: string): ReportCard | null {
  const grades = getGrades(studentId, term)

  if (grades.length === 0) return null

  const student = grades[0]
  const subjectGrades = grades.map((g) => ({
    subject: g.subject,
    score: g.score,
    maxScore: g.maxScore,
    percentage: (g.score / g.maxScore) * 100,
    grade: calculateLetterGrade((g.score / g.maxScore) * 100),
    remarks: g.remarks,
  }))

  const totalScore = subjectGrades.reduce((sum, s) => sum + s.score, 0)
  const totalMaxScore = subjectGrades.reduce((sum, s) => sum + s.maxScore, 0)
  const percentage = (totalScore / totalMaxScore) * 100

  return {
    studentId: student.studentId,
    studentName: student.studentName,
    rollNumber: student.rollNumber,
    grade: student.grade,
    section: student.section,
    term,
    subjects: subjectGrades,
    totalScore,
    totalMaxScore,
    percentage,
    overallGrade: calculateLetterGrade(percentage),
  }
}

export { subjects, terms }
