"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetUserPassword } from "@/app/actions/users"
import { toast } from "sonner"
import { KeyRound, ShieldAlert, Lock } from "lucide-react"

export function PasswordResetDialog({
    open,
    onOpenChange,
    userId,
    userEmail,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    userEmail: string
}) {
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password || password.length < 6) {
            toast.error("Security mandate: minimum 6 characters")
            return
        }

        setIsSubmitting(true)

        try {
            const result = await resetUserPassword(userId, password)

            if (result.success) {
                toast.success(result.message)
                setPassword("")
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to override passphrase")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-0 border-none bg-white dark:bg-zinc-950 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-8 bg-zinc-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <DialogHeader className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                                    <KeyRound size={20} />
                                </div>
                                <DialogTitle className="text-2xl font-black tracking-tight">Access Override</DialogTitle>
                            </div>
                            <DialogDescription className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                Force credential update for {userEmail}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-2xl flex gap-3">
                            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
                                Caution: This will immediately invalidate the user's current institutional credentials.
                            </p>
                        </div>

                        <div className="space-y-2 group">
                            <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">New Access Passphrase</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-11 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus:ring-2 focus:ring-amber-500/20 font-bold"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            >
                                Abort
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-14 px-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-500/20 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? "Overriding..." : "Confirm Override"}
                            </Button>
                        </DialogFooter>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

