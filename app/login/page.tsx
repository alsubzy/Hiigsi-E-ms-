"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { GraduationCap, Mail, Lock, Eye, EyeOff, Facebook, Chrome, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-[1100px] h-full min-h-[600px] bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 flex overflow-hidden border border-white/20">

        {/* Left Panel: Aesthetic & Branding */}
        <div className="w-[55%] hidden lg:flex bg-[#F8FAFC] p-10 flex-col justify-between relative overflow-hidden group">
          {/* Subtle Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-100/50 rounded-full blur-3xl -ml-32 -mb-32 transition-transform duration-1000 group-hover:scale-110" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase">
              Hiigsi <span className="text-blue-600">Skills</span>
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Interactive/Visual Stack */}
            <div className="relative w-full max-w-[340px] aspect-square">
              {/* Floating Card 1: Stats */}
              <div className="absolute top-0 left-0 w-[180px] bg-white p-5 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Chrome className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Rate</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">94.8%</div>
                <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 w-[94.8%]" />
                </div>
              </div>

              {/* Floating Card 2: Chart (recreated with CSS/SVG) */}
              <div className="absolute top-1/4 -right-4 w-[200px] bg-white p-6 rounded-[1.5rem] shadow-2xl border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-1000">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
                    <circle cx="50" cy="50" r="40" stroke="#3B82F6" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="60" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" stroke="#10B981" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="200" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="40" stroke="#F59E0B" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="230" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-800">76%</span>
                    <span className="text-[8px] font-semibold text-gray-400 uppercase">Success</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-gray-500">Learning Path</span>
                    <span className="text-blue-600 font-bold">+12.5%</span>
                  </div>
                </div>
              </div>

              {/* Floating Card 3: Action */}
              <div className="absolute bottom-4 left-4 w-[160px] bg-white p-4 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-green-500/20">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="text-[11px] font-bold text-gray-800 leading-tight">Master your skills today</div>
                <div className="text-[9px] text-gray-400 mt-1">Start your journey</div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Welcome back!
              </h2>
              <p className="mt-4 text-gray-500 text-lg max-w-[320px] mx-auto leading-relaxed">
                Start managing your academic journey faster and better with our optimized dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-gray-400">
            <button className="hover:text-blue-600 transition-colors"><ChevronLeft className="h-5 w-5" /></button>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
            </div>
            <button className="hover:text-blue-600 transition-colors"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-gray-900 uppercase">Hiigsi <span className="text-blue-600">Skills</span></span>
          </div>

          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back!</h1>
            <p className="mt-2 text-gray-500 font-medium">Please enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  type="email"
                  placeholder="Email address"
                  className="pl-12 h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-12 pr-12 h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <p className="mt-auto pt-10 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            © 2024 HIIGSI SKILLS • ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </div>
  )
}
