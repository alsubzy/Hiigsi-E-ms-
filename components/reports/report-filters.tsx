"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReportFiltersProps {
    onFilterChange: (filters: any) => void
    filterData: {
        classes: any[]
        sections: any[]
        academicYears: any[]
        terms: any[]
        subjects: any[]
    }
}

export function ReportFilters({ onFilterChange, filterData }: ReportFiltersProps) {
    const [filters, setFilters] = useState({
        classId: "all",
        sectionId: "all",
        academicYearId: "all",
        termId: "all",
        subjectId: "all",
        startDate: "",
        endDate: "",
    })

    // Filter sections based on selected class
    const availableSections = filters.classId === "all"
        ? filterData.sections
        : filterData.sections.filter(s => s.class_id === filters.classId)

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value }

        // Reset section if class changes
        if (key === "classId") {
            newFilters.sectionId = "all"
        }

        setFilters(newFilters)
    }

    const applyFilters = () => {
        // Convert "all" back to undefined for the API
        const apiFilters: any = {}
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "all" && value !== "") {
                apiFilters[key] = value
            }
        })
        onFilterChange(apiFilters)
    }

    const resetFilters = () => {
        const reset = {
            classId: "all",
            sectionId: "all",
            academicYearId: "all",
            termId: "all",
            subjectId: "all",
            startDate: "",
            endDate: "",
        }
        setFilters(reset)
        onFilterChange({})
    }

    const [isOpen, setIsOpen] = useState(false)
    const activeFiltersCount = Object.values(filters).filter(v => v !== "all" && v !== "").length

    return (
        <div className="relative">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-10 px-4 rounded-xl border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm gap-2 font-bold transition-all",
                        isOpen && "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xl ring-2 ring-primary/20"
                    )}
                >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                        <span className="flex items-center justify-center w-5 h-5 text-[10px] bg-primary text-white rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                </Button>

                {activeFiltersCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="h-10 px-3 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 gap-2 font-bold"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Reset</span>
                    </Button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-12 right-0 z-50 w-[320px] sm:w-[500px] md:w-[700px] lg:w-[900px] p-6 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <h4 className="font-black tracking-tight">Report Filters</h4>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Academic Year</Label>
                            <Select value={filters.academicYearId} onValueChange={(v) => handleFilterChange("academicYearId", v)}>
                                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none shadow-none focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="All Years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {filterData.academicYears.map((y) => (
                                        <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Term</Label>
                            <Select value={filters.termId} onValueChange={(v) => handleFilterChange("termId", v)}>
                                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none shadow-none focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="All Terms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Terms</SelectItem>
                                    {filterData.terms.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class</Label>
                            <Select value={filters.classId} onValueChange={(v) => handleFilterChange("classId", v)}>
                                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none shadow-none focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {filterData.classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Section</Label>
                            <Select value={filters.sectionId} onValueChange={(v) => handleFilterChange("sectionId", v)}>
                                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none shadow-none focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="All Sections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {availableSections.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</Label>
                            <Select value={filters.subjectId} onValueChange={(v) => handleFilterChange("subjectId", v)}>
                                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none shadow-none focus:ring-2 focus:ring-primary/20">
                                    <SelectValue placeholder="All Subjects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {filterData.subjects.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">From Date</Label>
                            <Input
                                type="date"
                                className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none shadow-none focus:ring-2 focus:ring-primary/20"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">To Date</Label>
                            <Input
                                type="date"
                                className="h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none shadow-none focus:ring-2 focus:ring-primary/20"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] text-muted-foreground max-w-[200px]">Filters will be applied across all dashboard views.</p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">
                                Close
                            </Button>
                            <Button size="sm" onClick={() => { applyFilters(); setIsOpen(false); }} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl px-8 font-black transition-transform active:scale-95 shadow-lg">
                                Apply Insights
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
