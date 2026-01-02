"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PasswordResetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (password: string) => void
}

export function PasswordResetDialog({ open, onOpenChange, onConfirm }: PasswordResetDialogProps) {
    const [password, setPassword] = useState("")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset User Password</DialogTitle>
                    <DialogDescription>
                        Enter a new password for this user. The password must be at least 6 characters long.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm(password)
                            onOpenChange(false)
                            setPassword("")
                        }}
                        disabled={password.length < 6}
                    >
                        Reset Password
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
