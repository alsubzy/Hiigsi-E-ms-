export interface Student {
  id: string
  name: string
  email: string
  phone: string
  grade: string
  section: string
  rollNumber: string
  dateOfBirth: string
  address: string
  parentName: string
  parentContact: string
  admissionDate: string
  status: "active" | "inactive"
}

// Demo data
export const demoStudents: Student[] = [
  {
    id: "1",
    name: "Emma Johnson",
    email: "emma.j@student.com",
    phone: "555-0101",
    grade: "Grade 10",
    section: "A",
    rollNumber: "10A001",
    dateOfBirth: "2009-03-15",
    address: "123 Oak Street, Springfield",
    parentName: "Michael Johnson",
    parentContact: "555-0201",
    admissionDate: "2023-08-01",
    status: "active",
  },
  {
    id: "2",
    name: "Liam Smith",
    email: "liam.s@student.com",
    phone: "555-0102",
    grade: "Grade 10",
    section: "A",
    rollNumber: "10A002",
    dateOfBirth: "2009-05-20",
    address: "456 Maple Avenue, Springfield",
    parentName: "Sarah Smith",
    parentContact: "555-0202",
    admissionDate: "2023-08-01",
    status: "active",
  },
  {
    id: "3",
    name: "Olivia Brown",
    email: "olivia.b@student.com",
    phone: "555-0103",
    grade: "Grade 9",
    section: "B",
    rollNumber: "9B001",
    dateOfBirth: "2010-07-10",
    address: "789 Pine Road, Springfield",
    parentName: "David Brown",
    parentContact: "555-0203",
    admissionDate: "2023-08-01",
    status: "active",
  },
  {
    id: "4",
    name: "Noah Davis",
    email: "noah.d@student.com",
    phone: "555-0104",
    grade: "Grade 11",
    section: "A",
    rollNumber: "11A001",
    dateOfBirth: "2008-11-25",
    address: "321 Elm Street, Springfield",
    parentName: "Jennifer Davis",
    parentContact: "555-0204",
    admissionDate: "2022-08-01",
    status: "active",
  },
  {
    id: "5",
    name: "Ava Wilson",
    email: "ava.w@student.com",
    phone: "555-0105",
    grade: "Grade 9",
    section: "A",
    rollNumber: "9A001",
    dateOfBirth: "2010-01-30",
    address: "654 Cedar Lane, Springfield",
    parentName: "Robert Wilson",
    parentContact: "555-0205",
    admissionDate: "2023-08-01",
    status: "active",
  },
  {
    id: "6",
    name: "Sophia Martinez",
    email: "sophia.m@student.com",
    phone: "555-0106",
    grade: "Grade 12",
    section: "A",
    rollNumber: "12A001",
    dateOfBirth: "2007-09-12",
    address: "987 Birch Avenue, Springfield",
    parentName: "Maria Martinez",
    parentContact: "555-0206",
    admissionDate: "2021-08-01",
    status: "active",
  },
]

export function getStudents(): Student[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("students")
    if (stored) {
      return JSON.parse(stored)
    }
  }
  return demoStudents
}

export function saveStudents(students: Student[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("students", JSON.stringify(students))
  }
}

export function getStudentById(id: string): Student | undefined {
  const students = getStudents()
  return students.find((s) => s.id === id)
}

export function addStudent(student: Omit<Student, "id">): Student {
  const students = getStudents()
  const newStudent = {
    ...student,
    id: Date.now().toString(),
  }
  students.push(newStudent)
  saveStudents(students)
  return newStudent
}

export function updateStudent(id: string, data: Partial<Student>): Student | null {
  const students = getStudents()
  const index = students.findIndex((s) => s.id === id)
  if (index === -1) return null

  students[index] = { ...students[index], ...data }
  saveStudents(students)
  return students[index]
}

export function deleteStudent(id: string): boolean {
  const students = getStudents()
  const filtered = students.filter((s) => s.id !== id)
  if (filtered.length === students.length) return false

  saveStudents(filtered)
  return true
}
