"use client"

import * as React from "react"
import { Languages, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage, type Language } from "@/components/language-provider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageToggle() {
    const { language, setLanguage, t } = useLanguage()

    const languages: { code: Language; label: string; flag: string }[] = [
        { code: "en", label: t("english"), flag: "🇺🇸" },
        { code: "so", label: t("somali"), flag: "🇸🇴" },
        { code: "ar", label: t("arabic"), flag: "🇸🇦" },
    ]

    return (
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
    )
}
