import { createFileRoute } from "@tanstack/react-router";
import { departments, overdueLearners, recentAssignments } from "@/lib/lms-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, AlertTriangle, ClipboardList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/hr/dashboard")({
  head: () => ({
    meta: [
      { title: "HR Dashboard — LearnHub" },
      { name: "description", content: "Completion rates, mandatory training status, and department analytics." },
    ],
  }),
  component: HRDashboardPage,
});

function HRDashboardPage() {
  const totalLearners = departments.reduce((s, d) => s + d.learners, 0);
  const avgCompletion = Math.round(departments.reduce((s, d) => s + d.completion, 0) / departments.length);
  const totalOverdue = departments.reduce((s, d) => s + d.overdue, 0);
  const maxLearners = Math.max(...departments.map((d) => d.learners));

  const kpis = [
    { label: "Active learners", value: totalLearners, icon: Users, tone: "info" as const },
    { label: "Completion rate", value: `${avgCompletion}%`, icon: CheckCircle2, tone: "success" as const },
    { label: "Overdue", value: totalOverdue, icon: AlertTriangle, tone: "warning" as const },
    { label: "Mandatory active", value: "8 courses", icon: ClipboardList, tone: "info" as const },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">HR Dashboard</h1>
        <p className="text-sm text-muted-foreground">Organization-wide training health</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{k.label}</div>
                  <div className="text-3xl font-semibold mt-1">{k.value}</div>
                </div>
                <div className={`p-2 rounded-lg bg-${k.tone}/15`}><k.icon className={`h-5 w-5 text-${k.tone}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Simple bar chart */}
          <div className="space-y-4">
            {departments.map((d) => (
              <div key={d.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">
                    {d.learners} learners · <span className="text-foreground font-medium">{d.completion}%</span> completion
                    {d.overdue > 0 && <span className="text-warning ml-2">· {d.overdue} overdue</span>}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-8 h-6 rounded-md bg-muted overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${d.completion}%` }} />
                    <div className="h-full bg-warning/60" style={{ width: `${(d.overdue / d.learners) * 100}%` }} />
                  </div>
                  <div className="col-span-4 h-6 rounded-md bg-info/10 overflow-hidden">
                    <div className="h-full bg-info" style={{ width: `${(d.learners / maxLearners) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-4 pt-2 text-xs text-muted-foreground">
              <Legend color="bg-primary" label="Completed" />
              <Legend color="bg-warning/60" label="Overdue" />
              <Legend color="bg-info" label="Headcount" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent assignments</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recentAssignments.map((a, i) => (
                <li key={i} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{a.course}</div>
                    <div className="text-xs text-muted-foreground">{a.assignedTo}</div>
                  </div>
                  <Badge variant="secondary">{a.date}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Overdue learners</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueLearners.map((l) => (
                  <TableRow key={l.name}>
                    <TableCell>
                      <div className="font-medium text-sm">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{l.department}</div>
                    </TableCell>
                    <TableCell className="text-sm">{l.course}</TableCell>
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
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}
