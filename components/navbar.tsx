"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, School, Languages, ChevronDown } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage, type Language } from "@/components/language-provider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
    const [isOpen, setIsOpen] = React.useState(false)
    const { language, setLanguage, t, dir } = useLanguage()

    const navLinks = [
        { name: t("home"), href: "/" },
        { name: t("about"), href: "/about" },
        { name: t("services"), href: "/services" },
        { name: t("contact"), href: "/contact" },
    ]

    const languages: { code: Language; label: string; flag: string }[] = [
        { code: "en", label: t("english"), flag: "🇺🇸" },
        { code: "so", label: t("somali"), flag: "🇸🇴" },
        { code: "ar", label: t("arabic"), flag: "🇸🇦" },
    ]

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                                <School className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black tracking-tight text-foreground">{t("schoolName")}</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter leading-none">{t("terminal")}</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Language Selector */}
                        <div className="hidden sm:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2 font-bold h-9">
                                        <Languages className="w-4 h-4" />
                                        <span className="uppercase text-xs">{language}</span>
                                        <ChevronDown className="w-3 h-3 opacity-50" />
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
                        </div>

                        <div className="hidden sm:block">
                            <ModeToggle />
                        </div>

                        <Link href="/login" className="hidden sm:flex">
                            <Button size="sm" className="font-bold rounded-lg px-6">
                                {t("login")}
                            </Button>
                        </Link>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-muted-foreground"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            <div
                className={cn(
                    "md:hidden absolute w-full bg-background border-b transition-all duration-300 ease-in-out overflow-hidden shadow-xl",
                    isOpen ? "max-h-[500px] border-t" : "max-h-0 border-none"
                )}
            >
                <div className="px-4 pt-2 pb-6 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-3 rounded-xl text-base font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                        >
                            {link.name}
                        </Link>
                    ))}

                    <div className="pt-4 border-t space-y-4">
                        <div className="flex items-center justify-between px-3">
                            <span className="text-sm font-bold text-muted-foreground uppercase">{t("language")}</span>
                            <div className="flex gap-1 bg-muted p-1 rounded-lg">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={cn(
                                            "px-3 py-1 transparent rounded-md text-xs font-bold transition-all",
                                            language === lang.code ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {lang.code.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-3">
                            <span className="text-sm font-bold text-muted-foreground uppercase">{t("theme")}</span>
                            <ModeToggle />
                        </div>

                        <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full pt-2">
                            <Button className="w-full font-bold h-12 rounded-xl">
                                {t("getStarted")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
