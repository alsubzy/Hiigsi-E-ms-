import { cookies } from "next/headers"
import { Language, translations } from "@/lib/translations"

export async function getLanguage(): Promise<Language> {
    const cookieStore = await cookies()
    const language = cookieStore.get("language")?.value as Language || "en"
    return ["en", "so", "ar"].includes(language) ? language : "en"
}

export async function getTranslations(lang?: Language) {
    const language = lang || await getLanguage()
    return translations[language]
}
