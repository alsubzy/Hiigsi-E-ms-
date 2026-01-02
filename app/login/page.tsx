"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, Facebook, Chrome, Plus, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Check user status
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .single()

      if (profile && profile.status !== "active") {
        await supabase.auth.signOut()
        throw new Error("Your account is " + profile.status + ". Please contact support.")
      }

      toast.success("Login successful! Welcome to the dashboard.")
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#D1D5DB] flex items-center justify-center p-4">
      <div className="w-full max-w-[1000px] h-[750px] bg-white rounded-[3rem] shadow-2xl flex overflow-hidden">

        {/* Left Panel */}
        <div className="w-[45%] bg-[#F8FAFF] p-12 flex flex-col justify-between relative hidden md:flex">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-[#3B82F6] flex items-center justify-center relative">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">FINOTIC</span>
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center">
            {/* Floating Visual Elements */}
            <div className="relative w-full max-w-[300px] aspect-square">
              {/* Card 1: Current Balance */}
              <div className="absolute top-0 left-0 w-[160px] bg-white p-5 rounded-3xl shadow-lg border border-gray-50 z-20">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-4">
                  <Wallet className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Current Balance</p>
                <h3 className="text-xl font-extrabold text-[#1E293B]">$24,359</h3>
              </div>

              {/* Card 2: 34% Food Donut Chart */}
              <div className="absolute top-16 -right-8 w-[180px] bg-white p-6 rounded-[2rem] shadow-2xl border border-gray-50 z-30">
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
                    <circle cx="50" cy="50" r="40" stroke="#3B82F6" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="200" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" stroke="#10B981" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="230" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" stroke="#EF4444" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="245" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <span className="text-2xl font-black text-[#1E293B]">34%</span>
                    <span className="text-[10px] font-bold text-gray-400">Food</span>
                  </div>
                </div>
              </div>

              {/* Card 3: New Transaction (Dashed) */}
              <div className="absolute bottom-4 -left-4 w-[200px] bg-white p-6 rounded-[2rem] shadow-lg border-2 border-dashed border-gray-100 flex flex-col items-center z-10">
                <div className="w-10 h-10 rounded-full bg-[#3B82F6] flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#1E293B]">New transaction</p>
                <p className="text-[10px] text-gray-400 font-medium">or upload .xls file</p>
              </div>
            </div>

            <div className="mt-8 text-left w-full">
              <h2 className="text-3xl font-black text-[#1E293B]">Welcome back!</h2>
              <div className="mt-4 space-y-1">
                <p className="text-gray-400 font-medium text-sm">Start managing your finance faster and better</p>
                <p className="text-gray-400 font-medium text-sm">Start managing your finance faster and better</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-[#3B82F6] transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <div className="flex gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
            </div>
            <button className="text-gray-400 hover:text-[#3B82F6] transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white p-12 lg:p-20 flex flex-col justify-center relative">
          <div className="max-w-[380px] mx-auto w-full">
            <h1 className="text-3xl font-black text-[#1E293B] mb-2">Welcome back!</h1>
            <p className="text-gray-400 font-medium text-sm mb-12">Start managing your finance faster and better</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-300" />
                  </div>
                  <Input
                    type="email"
                    placeholder="you@exmaple.com"
                    className="h-14 pl-12 bg-[#F8FAFF] border-none rounded-xl text-sm font-medium focus-visible:ring-1 focus-visible:ring-blue-100 placeholder:text-gray-300"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-300" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    className="h-14 pl-12 pr-12 bg-[#F8FAFF] border-none rounded-xl text-sm font-medium focus-visible:ring-1 focus-visible:ring-blue-100 placeholder:text-gray-300"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm font-bold text-[#3B82F6] hover:underline transition-all">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-base shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-300 tracking-widest">
                  <span className="bg-white px-4">or</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-xl border-gray-100 font-bold text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => toast.info("Google login coming soon")}
                >
                  <Chrome className="w-5 h-5 text-[#DB4437]" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-xl border-gray-100 font-bold text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => toast.info("Facebook login coming soon")}
                >
                  <Facebook className="w-5 h-5 text-[#4267B2]" />
                  Facebook
                </Button>
              </div>

              <div className="text-center text-sm font-medium text-gray-400 pt-2">
                Don&apos;t you have an account?{" "}
                <Link href="/signup" className="text-[#3B82F6] font-bold hover:underline">
                  Sign Up
                </Link>
              </div>
            </form>
          </div>

          <div className="absolute bottom-8 left-0 w-full text-center">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2022 ALL RIGHTS RESERVED</p>
          </div>
        </div>
      </div>
    </div>
  )
}
