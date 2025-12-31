"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Clock, Users, Plus, Trash2 } from "lucide-react"
import { ClassDialog } from "@/components/academic/class-dialog"
import { SubjectDialog } from "@/components/academic/subject-dialog"
import { TimetableDialog } from "@/components/academic/timetable-dialog"
import { EventDialog } from "@/components/academic/event-dialog"
import { deleteClass, deleteSubject, deleteTimetableEntry, deleteCalendarEvent } from "@/app/actions/academic"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AcademicClientProps {
  initialClasses: any[]
  initialSubjects: any[]
  initialTimetable: any[]
  initialEvents: any[]
}

export function AcademicClient({
  initialClasses,
  initialSubjects,
  initialTimetable,
  initialEvents,
}: AcademicClientProps) {
  const [view, setView] = useState<"classes" | "subjects" | "timetable" | "calendar">("classes")
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    let result
    switch (type) {
      case "class":
        result = await deleteClass(id)
        break
      case "subject":
        result = await deleteSubject(id)
        break
      case "timetable":
        result = await deleteTimetableEntry(id)
        break
      case "event":
        result = await deleteCalendarEvent(id)
        break
    }

    if (result?.success) {
      toast({ title: "Success", description: "Item deleted successfully" })
      window.location.reload()
    } else {
      toast({ title: "Error", description: result?.error || "Failed to delete item", variant: "destructive" })
    }
  }

  const stats = [
    { title: "Total Classes", value: initialClasses.length, icon: Users, color: "text-blue-500" },
    {
      title: "Active Subjects",
      value: initialSubjects.filter((s) => s.is_active).length,
      icon: BookOpen,
      color: "text-green-500",
    },
    { title: "Timetable Entries", value: initialTimetable.length, icon: Clock, color: "text-orange-500" },
    {
      title: "Upcoming Events",
      value: initialEvents.filter((e) => new Date(e.start_date) >= new Date()).length,
      icon: Calendar,
      color: "text-purple-500",
    },
  ]

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <>
      <Header title="Academic Management" description="Manage classes, subjects, timetable, and calendar" />
      <div className="p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-2">
          <Button variant={view === "classes" ? "default" : "outline"} onClick={() => setView("classes")}>
            Classes
          </Button>
          <Button variant={view === "subjects" ? "default" : "outline"} onClick={() => setView("subjects")}>
            Subjects
          </Button>
          <Button variant={view === "timetable" ? "default" : "outline"} onClick={() => setView("timetable")}>
            Timetable
          </Button>
          <Button variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>
            Calendar
          </Button>
        </div>

        {view === "classes" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Classes</CardTitle>
              <Button
                onClick={() => {
                  setSelectedItem(null)
                  setClassDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Class Teacher</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialClasses.length > 0 ? (
                    initialClasses.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.grade_level}</TableCell>
                        <TableCell>{cls.section}</TableCell>
                        <TableCell>{cls.capacity}</TableCell>
                        <TableCell>{cls.room_number || "-"}</TableCell>
                        <TableCell>{cls.class_teacher?.full_name || "Not Assigned"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("class", cls.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No classes found. Add your first class to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {view === "subjects" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subjects</CardTitle>
              <Button
                onClick={() => {
                  setSelectedItem(null)
                  setSubjectDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialSubjects.length > 0 ? (
                    initialSubjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>{subject.code}</TableCell>
                        <TableCell>{subject.credits}</TableCell>
                        <TableCell>
                          <Badge variant={subject.is_active ? "default" : "secondary"}>
                            {subject.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{subject.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("subject", subject.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No subjects found. Add your first subject to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {view === "timetable" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Timetable</CardTitle>
              <Button
                onClick={() => {
                  setSelectedItem(null)
                  setTimetableDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialTimetable.length > 0 ? (
                    initialTimetable.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{daysOfWeek[entry.day_of_week - 1]}</TableCell>
                        <TableCell>
                          {entry.start_time} - {entry.end_time}
                        </TableCell>
                        <TableCell>{entry.class?.name || "-"}</TableCell>
                        <TableCell>{entry.subject?.name || "-"}</TableCell>
                        <TableCell>{entry.teacher?.full_name || "Not Assigned"}</TableCell>
                        <TableCell>{entry.room_number || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("timetable", entry.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No timetable entries found. Add your first entry to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {view === "calendar" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Academic Calendar</CardTitle>
              <Button
                onClick={() => {
                  setSelectedItem(null)
                  setEventDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialEvents.length > 0 ? (
                    initialEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              event.event_type === "holiday"
                                ? "secondary"
                                : event.event_type === "exam"
                                  ? "destructive"
                                  : "default"
                            }
                          >
                            {event.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(event.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(event.end_date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{event.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("event", event.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No events found. Add your first event to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <ClassDialog open={classDialogOpen} onOpenChange={setClassDialogOpen} classData={selectedItem} />
      <SubjectDialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen} subjectData={selectedItem} />
      <TimetableDialog
        open={timetableDialogOpen}
        onOpenChange={setTimetableDialogOpen}
        classes={initialClasses}
        subjects={initialSubjects}
      />
      <EventDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} eventData={selectedItem} />
    </>
  )
}
