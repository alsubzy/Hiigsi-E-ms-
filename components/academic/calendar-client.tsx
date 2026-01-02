"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, Plus, MoreVertical, Trash, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

import { createAcademicYear, setActiveAcademicYear, createTerm, deleteTerm, AcademicYear, Term } from "@/app/actions/academic"

interface CalendarClientProps {
    years: AcademicYear[]
    terms: Term[]
}

export function CalendarClient({ years, terms }: CalendarClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("overview")
    const [isYearDialogOpen, setIsYearDialogOpen] = useState(false)
    const [isTermDialogOpen, setIsTermDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [idToDelete, setIdToDelete] = useState<string | null>(null)

    // Year Form State
    const [yearName, setYearName] = useState("")
    const [yearStartDate, setYearStartDate] = useState<Date>()
    const [yearEndDate, setYearEndDate] = useState<Date>()

    // Term Form State
    const [termName, setTermName] = useState("")
    const [selectedYearId, setSelectedYearId] = useState<string>(years.find(y => y.is_active)?.id || "")
    const [termStartDate, setTermStartDate] = useState<Date>()
    const [termEndDate, setTermEndDate] = useState<Date>()

    const activeYear = years.find((y) => y.is_active)

    async function handleCreateYear(e: React.FormEvent) {
        e.preventDefault()
        if (!yearStartDate || !yearEndDate) {
            toast.error("Please select start and end dates")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createAcademicYear({
                year_name: yearName,
                start_date: yearStartDate.toISOString(),
                end_date: yearEndDate.toISOString(),
            })

            if (result.success) {
                toast.success(result.message)
                setIsYearDialogOpen(false)
                setYearName("")
                setYearStartDate(undefined)
                setYearEndDate(undefined)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to create academic year.")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleSetActiveYear(id: string) {
        try {
            const result = await setActiveAcademicYear(id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to set active year.")
        }
    }

    async function handleCreateTerm(e: React.FormEvent) {
        e.preventDefault()
        if (!termStartDate || !termEndDate || !selectedYearId) {
            toast.error("Please fill all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createTerm({
                academic_year_id: selectedYearId,
                name: termName,
                start_date: termStartDate.toISOString(),
                end_date: termEndDate.toISOString(),
                status: "pending"
            })

            if (result.success) {
                toast.success(result.message)
                setIsTermDialogOpen(false)
                setTermName("")
                setTermStartDate(undefined)
                setTermEndDate(undefined)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error: any) {
            toast.error("Failed to create term.")
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleDeleteTerm(id: string) {
        setIdToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    async function confirmDeleteTerm() {
        if (!idToDelete) return
        const result = await deleteTerm(idToDelete)
        if (result.success) {
            toast.success(result.message)
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIdToDelete(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Academic Calendar</h2>
                    <p className="text-muted-foreground">Manage academic years, terms, and holidays.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsYearDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Academic Year
                    </Button>
                    <Button variant="outline" onClick={() => setIsTermDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Term
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Academic Year</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeYear?.year_name || "None Set"}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeYear
                                ? `${format(new Date(activeYear.start_date), "MMM d, yyyy")} - ${format(new Date(activeYear.end_date), "MMM d, yyyy")}`
                                : "Set an active year to begin"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="years" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="years">Academic Years</TabsTrigger>
                    <TabsTrigger value="terms">Terms</TabsTrigger>
                </TabsList>

                <TabsContent value="years" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {years.map((year) => (
                            <Card key={year.id} className={cn(year.is_active && "border-primary")}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div>
                                        <CardTitle className="text-lg font-bold">{year.year_name}</CardTitle>
                                        <CardDescription>
                                            {format(new Date(year.start_date), "MMM yyyy")} - {format(new Date(year.end_date), "MMM yyyy")}
                                        </CardDescription>
                                    </div>
                                    {year.is_active && (
                                        <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                            Active
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="mt-4 flex justify-end">
                                        {!year.is_active && (
                                            <Button variant="outline" size="sm" onClick={() => handleSetActiveYear(year.id)}>
                                                Set Active
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="terms" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Terms Configuration</CardTitle>
                            <CardDescription>Manage terms for academic years.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {terms.map((term) => {
                                    const year = years.find(y => y.id === term.academic_year_id)
                                    return (
                                        <div key={term.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="space-y-1">
                                                    <p className="font-medium leading-none">{term.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {year?.year_name} • {format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTerm(term.id)}>
                                                <Trash className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                {terms.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No terms configured yet.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Year Dialog */}
            <Dialog open={isYearDialogOpen} onOpenChange={setIsYearDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Academic Year</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateYear} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Year Name</Label>
                            <Input placeholder="e.g. 2024-2025" value={yearName} onChange={(e) => setYearName(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <DatePicker date={yearStartDate} setDate={setYearStartDate} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <DatePicker date={yearEndDate} setDate={setYearEndDate} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Term Dialog */}
            <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Term</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTerm} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Academic Year</Label>
                            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y.id} value={y.id}>{y.year_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Term Name</Label>
                            <Input placeholder="e.g. Term 1" value={termName} onChange={(e) => setTermName(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <DatePicker date={termStartDate} setDate={setTermStartDate} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <DatePicker date={termEndDate} setDate={setTermEndDate} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDeleteTerm}
                title="Delete Term"
                description="Are you sure you want to delete this term? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    )
}

function DatePicker({ date, setDate }: { date: Date | undefined; setDate: (date: Date | undefined) => void }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
        </Popover>
    )
}
