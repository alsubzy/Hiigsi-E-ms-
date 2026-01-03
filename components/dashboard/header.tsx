"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl px-6 sticky top-0 z-10 transition-all supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-xs text-muted-foreground hidden md:block">{description}</p>}
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex relative w-64 mr-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9 h-9 bg-background/50 border-zinc-200 dark:border-zinc-800"
          />
        </div>
        <LanguageToggle />
        <ModeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 border-2 border-white dark:border-zinc-950"></span>
        </Button>
      </div>
    </div>
  )
}
