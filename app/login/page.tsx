"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, Plus, ChevronLeft, ChevronRight, Wallet, Languages } from "lucide-react"
import { toast } from "sonner"
import { ModeToggle } from "@/components/mode-toggle"
import { useLanguage, type Language } from "@/components/language-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { language, setLanguage, t, dir } = useLanguage()

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .single()

      if (profile && profile.status !== "active") {
        await supabase.auth.signOut()
        throw new Error("Your account is " + profile.status + ". Please contact support.")
      }

      toast.success(t("login") + " successful!")
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "en", label: t("english"), flag: "🇺🇸" },
    { code: "so", label: t("somali"), flag: "🇸🇴" },
    { code: "ar", label: t("arabic"), flag: "🇸🇦" },
  ]

  return (
    <div className="min-h-screen bg-slate-200 dark:bg-slate-950 transition-colors duration-500 flex items-center justify-center p-4">
      {/* Top Controls */}
      <div className={cn(
        "absolute top-8 z-50 flex items-center gap-2",
        dir === "rtl" ? "left-8" : "right-8"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 font-bold h-9 bg-white dark:bg-slate-900 border-none shadow-lg">
              <Languages className="w-4 h-4" />
              <span className="uppercase text-xs">{language}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px] rounded-xl">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "gap-3 font-medium cursor-pointer",
                  language === lang.code && "bg-primary/10 text-primary"
                )}
              >
                <span>{lang.flag}</span>
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ModeToggle />
      </div>

      <div className="w-full max-w-[1000px] h-fit md:h-[750px] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-500">

        {/* Branding Panel (Left in LTR, Right in RTL) */}
        <div className={cn(
          "md:w-[45%] bg-slate-50 dark:bg-slate-800/50 p-12 flex flex-col justify-between relative hidden md:flex",
          dir === "rtl" && "md:order-last"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary flex items-center justify-center relative">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase italic">{t("schoolName")}</span>
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center">
            {/* Floating Visual Elements */}
            <div className="relative w-full max-w-[300px] aspect-square">
              {/* Card 1 */}
              <div className={cn(
                "absolute top-0 w-[160px] bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-lg border border-slate-50 dark:border-slate-700 z-20",
                dir === "rtl" ? "right-0" : "left-0"
              )}>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t("currentBalance")}</p>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">$24,359</h3>
              </div>

              {/* Card 2 */}
              <div className={cn(
                "absolute top-16 w-[180px] bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-2xl border border-slate-50 dark:border-slate-700 z-30",
                dir === "rtl" ? "-left-8" : "-right-8"
              )}>
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="200" strokeLinecap="round" className="text-primary" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="230" strokeLinecap="round" className="text-emerald-500" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset="245" strokeLinecap="round" className="text-red-500" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">34%</span>
                    <span className="text-[10px] font-bold text-slate-400">{t("fees")}</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className={cn(
                "absolute bottom-4 w-[200px] bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-lg border-2 border-dashed border-slate-100 dark:border-slate-700 flex flex-col items-center z-10",
                dir === "rtl" ? "-right-4" : "-left-4"
              )}>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{t("newTransaction")}</p>
                <p className="text-[10px] text-slate-400 font-medium">{t("systemSync")}</p>
              </div>
            </div>

            <div className="mt-8 text-left w-full" style={{ textAlign: dir === "rtl" ? "right" : "left" }}>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t("schoolName")}</h2>
              <div className="mt-4 space-y-1">
                <p className="text-slate-400 font-medium text-sm">{t("schoolSubtitle")}</p>
                <p className="text-slate-400 font-medium text-sm">{t("empowerEducation")}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 justify-center">
            <button className="text-slate-400 hover:text-primary transition-colors hover:scale-110">
              {dir === "rtl" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <div className="flex gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <button className="text-slate-400 hover:text-primary transition-colors hover:scale-110">
              {dir === "rtl" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Login Form Panel */}
        <div className="flex-1 bg-white dark:bg-slate-900 p-12 lg:p-20 flex flex-col justify-center relative items-center">
          <div className="max-w-[380px] w-full" style={{ textAlign: dir === "rtl" ? "right" : "left" }}>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{t("welcomeBack")}</h1>
            <p className="text-slate-400 font-medium text-sm mb-12">{t("loginSubtitle")}</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className={cn(
                    "absolute inset-y-0 flex items-center pointer-events-none",
                    dir === "rtl" ? "right-0 pr-4" : "left-0 pl-4"
                  )}>
                    <Mail className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  </div>
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className={cn(
                      "h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-slate-300 dark:placeholder:text-slate-600",
                      dir === "rtl" ? "pr-12 pl-4" : "pl-12 pr-4"
                    )}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <div className={cn(
                    "absolute inset-y-0 flex items-center pointer-events-none",
                    dir === "rtl" ? "right-0 pr-4" : "left-0 pl-4"
                  )}>
                    <Lock className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    className={cn(
                      "h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-slate-300 dark:placeholder:text-slate-600",
                      dir === "rtl" ? "pr-12 pl-12" : "pl-12 pr-12"
                    )}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      "absolute inset-y-0 flex items-center text-slate-400 hover:text-slate-500",
                      dir === "rtl" ? "left-0 pl-4" : "right-0 pr-4"
                    )}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className={cn("flex", dir === "rtl" ? "justify-start" : "justify-end")}>
                <Link href="/forgot-password" className="text-sm font-bold text-primary hover:underline transition-all opacity-50 cursor-not-allowed pointer-events-none">
                  {t("forgotPassword")}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl text-base shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? t("validatingAccount") : t("loginButtonText")}
              </Button>
            </form>
          </div>

          <div className="absolute bottom-8 left-0 w-full text-center">
            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">{t("copyright")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
