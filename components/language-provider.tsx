"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { translations, type Language } from "@/lib/translations"
import Cookies from "js-cookie"

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
        // Check cookies first, then localStorage
        const savedLang = Cookies.get("language") as Language
        if (savedLang && ["en", "so", "ar"].includes(savedLang)) {
            setLanguageState(savedLang)
            document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr"
            document.documentElement.lang = savedLang
        } else {
            const localLang = localStorage.getItem("language") as Language
            if (localLang && ["en", "so", "ar"].includes(localLang)) {
                setLanguage(localLang) // This will set cookie too
            }
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem("language", lang)
        Cookies.set("language", lang, { expires: 365, path: '/' }) // Persist for 1 year, accessible across whole site
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
