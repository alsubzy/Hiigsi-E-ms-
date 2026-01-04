"use client"

import { Button } from "@/components/ui/button"
import { FileText, Download, Printer } from "lucide-react"

interface ExportButtonsProps {
    data: any[]
    filename: string
    title: string
}

export function ExportButtons({ data, filename, title }: ExportButtonsProps) {
    const exportToCSV = () => {
        if (!data || data.length === 0) return

        // Get headers from first object
        const headers = Object.keys(data[0])
        const csvContent = [
            headers.join(","),
            ...data.map(row =>
                headers.map(header => {
                    const val = row[header]
                    // Basic escape for commas
                    return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                }).join(",")
            )
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800">
                <Printer className="w-4 h-4" /> Print PDF
            </Button>
        </div>
    )
}
