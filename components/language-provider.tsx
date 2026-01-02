"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { translations, type Language } from "@/lib/translations"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
    dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en")
    const [dir, setDir] = useState<"ltr" | "rtl">("ltr")

    useEffect(() => {
        const savedLang = localStorage.getItem("language") as Language
        if (savedLang && ["en", "so", "ar"].includes(savedLang)) {
            setLanguage(savedLang)
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem("language", lang)
        const newDir = lang === "ar" ? "rtl" : "ltr"
        setDir(newDir)
        document.documentElement.dir = newDir
        document.documentElement.lang = lang
    }

    // Enhanced translation function with nested key support
    const t = (key: string): string => {
        const keys = key.split(".")
        let value: any = translations[language]

        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k]
            } else {
                // Fallback to key if translation not found
                return key
            }
        }

        return typeof value === "string" ? value : key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}

// Export Language type for use in other components
export type { Language }
