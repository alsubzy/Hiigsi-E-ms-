'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[Dashboard Error Boundary]:', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="mb-6 rounded-full bg-red-50 p-4 dark:bg-red-900/10">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Something went wrong!
            </h2>

            <p className="mb-8 max-w-md text-zinc-500 font-medium">
                We encountered an unexpected error while loading this part of the dashboard.
                Don't worry, your data is safe.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={() => reset()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-6 h-11 rounded-xl shadow-lg shadow-blue-200"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Try Again
                </Button>

                <Link href="/dashboard">
                    <Button
                        variant="outline"
                        className="font-bold gap-2 px-6 h-11 rounded-xl border-zinc-200"
                    >
                        <Home className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>

            {process.env.NODE_ENV === 'development' && (
                <div className="mt-12 w-full max-w-2xl overflow-hidden rounded-xl bg-zinc-50 p-4 text-left border border-zinc-100">
                    <p className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-widest mb-2">Debug Trace</p>
                    <pre className="text-[10px] font-mono whitespace-pre-wrap text-red-600 bg-white p-4 rounded-lg border border-red-50">
                        {error.message}
                        {"\n\n"}
                        {error.stack}
                    </pre>
                </div>
            )}
        </div>
    )
}
