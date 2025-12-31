"use client"

export type UserRole = "admin" | "teacher" | "accountant" | "staff"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

const DEMO_USERS: Record<string, User> = {
  "admin@school.com": {
    id: "1",
    name: "Admin User",
    email: "admin@school.com",
    role: "admin",
  },
  "teacher@school.com": {
    id: "2",
    name: "John Teacher",
    email: "teacher@school.com",
    role: "teacher",
  },
  "accountant@school.com": {
    id: "3",
    name: "Jane Accountant",
    email: "accountant@school.com",
    role: "accountant",
  },
  "staff@school.com": {
    id: "4",
    name: "Bob Staff",
    email: "staff@school.com",
    role: "staff",
  },
}

export function login(email: string, password: string): User | null {
  // Demo login - accepts any password
  const user = DEMO_USERS[email.toLowerCase()]
  if (user) {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user))
    }
    return user
  }
  return null
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser")
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("currentUser")
    if (stored) {
      return JSON.parse(stored)
    }
  }
  return null
}

export function hasPermission(user: User | null, requiredRoles: UserRole[]): boolean {
  if (!user) return false
  return requiredRoles.includes(user.role)
}
