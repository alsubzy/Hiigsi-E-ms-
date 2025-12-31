"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile, changePassword } from "@/app/actions/settings"
import { toast } from "@/hooks/use-toast"
import { User, Lock, Building } from "lucide-react"

interface SettingsClientProps {
  user: any
  schoolSettings: any
}

export function SettingsClient({ user, schoolSettings }: SettingsClientProps) {
  const [view, setView] = useState<"profile" | "password" | "school">("profile")
  const [loading, setLoading] = useState(false)

  const [profileData, setProfileData] = useState({
    full_name: user.full_name || "",
    email: user.email || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateProfile(profileData)
      if (result.success) {
        toast({ title: "Success", description: "Profile updated successfully" })
      } else {
        toast({ title: "Error", description: result.error || "Failed to update profile", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (result.success) {
        toast({ title: "Success", description: "Password changed successfully" })
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        toast({ title: "Error", description: result.error || "Failed to change password", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Settings" description="Manage your account and system settings" />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <Button variant={view === "profile" ? "default" : "outline"} onClick={() => setView("profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button variant={view === "password" ? "default" : "outline"} onClick={() => setView("password")}>
            <Lock className="mr-2 h-4 w-4" />
            Password
          </Button>
          {user.role === "admin" && (
            <Button variant={view === "school" ? "default" : "outline"} onClick={() => setView("school")}>
              <Building className="mr-2 h-4 w-4" />
              School
            </Button>
          )}
        </div>

        {view === "profile" && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and email address</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user.role} disabled className="capitalize" />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {view === "password" && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {view === "school" && user.role === "admin" && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>School Settings</CardTitle>
              <CardDescription>Manage school-wide configuration and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Academic Year</Label>
                  <Input value={schoolSettings?.year_name || "Not set"} disabled />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      value={
                        schoolSettings?.start_date ? new Date(schoolSettings.start_date).toLocaleDateString() : "N/A"
                      }
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      value={schoolSettings?.end_date ? new Date(schoolSettings.end_date).toLocaleDateString() : "N/A"}
                      disabled
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    To manage academic years, classes, and other school settings, please use the Academic Management
                    module.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
