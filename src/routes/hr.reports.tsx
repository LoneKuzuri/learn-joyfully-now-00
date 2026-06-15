import { createFileRoute } from "@tanstack/react-router";
import { overdueLearners, departments } from "@/lib/lms-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export const Route = createFileRoute("/hr/reports")({
  head: () => ({ meta: [{ title: "Reports — HR" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { allowed } = useAuthGuard("hr");
  if (!allowed) return null;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Compliance & completion exports</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-1.5" /> Export CSV</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Department completion</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Learners</TableHead>
                <TableHead className="text-right">Completion</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-right">{d.learners}</TableCell>
                  <TableCell className="text-right">{d.completion}%</TableCell>
                  <TableCell className="text-right">
                    {d.overdue > 0 ? <Badge variant="outline" className="text-warning border-warning/40">{d.overdue}</Badge> : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Overdue learners</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Days overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueLearners.map((l) => (
                <TableRow key={l.name}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.department}</TableCell>
                  <TableCell>{l.course}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-warning border-warning/40">{l.daysOverdue}d</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
