"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface ReportCardProps {
  reportCard: any
}

export function ReportCardView({ reportCard }: ReportCardProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Student Report Card</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {reportCard.student.grade} - {reportCard.student.section}
            </p>
          </div>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-semibold">{`${reportCard.student.first_name} ${reportCard.student.last_name}`}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll Number</p>
              <p className="font-semibold">{reportCard.student.roll_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grade</p>
              <p className="font-semibold">Grade {reportCard.student.grade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Section</p>
              <p className="font-semibold">{reportCard.student.section}</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Subject</th>
                  <th className="text-center p-3 font-semibold">Marks</th>
                  <th className="text-center p-3 font-semibold">Grade</th>
                  <th className="text-left p-3 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {reportCard.grades.map((gradeItem: any, index: number) => (
                  <tr key={gradeItem.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="p-3 font-medium">{gradeItem.subjects.name}</td>
                    <td className="p-3 text-center">{Number(gradeItem.marks).toFixed(0)}</td>
                    <td className="p-3 text-center font-semibold">{gradeItem.grade}</td>
                    <td className="p-3 text-sm text-muted-foreground">{gradeItem.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-primary/10 font-semibold">
                <tr>
                  <td className="p-3">Overall</td>
                  <td className="p-3 text-center">{reportCard.avgMarks.toFixed(1)}</td>
                  <td className="p-3 text-center text-lg">{reportCard.overallGrade}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Performance Summary</h3>
            <p className="text-sm text-muted-foreground">
              {reportCard.avgMarks >= 90
                ? "Outstanding performance! Keep up the excellent work."
                : reportCard.avgMarks >= 80
                  ? "Good performance overall. Continue working hard."
                  : reportCard.avgMarks >= 70
                    ? "Satisfactory performance. There is room for improvement."
                    : reportCard.avgMarks >= 60
                      ? "Average performance. More effort is needed."
                      : "Needs significant improvement. Please schedule a meeting with the teacher."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
