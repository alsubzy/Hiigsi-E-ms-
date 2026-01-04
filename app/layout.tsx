import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | Hiigsi Skills',
    default: 'Hiigsi Skills | Modern School Management',
  },
  description: 'A professional and comprehensive school management system for modern institutions.',
  generator: 'Hiigsi Skills',
  keywords: ['school management', 'education', 'erp', 'hiigsi skills'],
  authors: [{ name: 'Hiigsi Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  icons: {
    icon: '/hiigsi-favicon.jpg',
    shortcut: '/hiigsi-favicon.jpg',
    apple: '/hiigsi-favicon.jpg',
  },
}

import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased font-sans`} suppressHydrationWarning>
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                classNames: {
                  toast: "group rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 p-5 flex flex-col items-start gap-1",
                  title: "text-base font-bold text-slate-900 dark:text-white leading-tight",
                  description: "text-xs font-medium text-slate-500 dark:text-slate-400",
                  success: "border-l-[6px] border-l-emerald-500",
                  error: "border-l-[6px] border-l-rose-500",
                  info: "border-l-[6px] border-l-blue-500",
                  warning: "border-l-[6px] border-l-orange-500",
                }
              }}
            />
            <Analytics />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
