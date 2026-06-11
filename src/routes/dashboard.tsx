import { createFileRoute, Link } from "@tanstack/react-router";
import { courses, recentActivity } from "@/lib/lms-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, ClipboardList, Award, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LearnHub" },
      { name: "description", content: "Track your assignments, progress, and certifications at a glance." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const assigned = courses.filter((c) => c.mandatory);
  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100);
  const completed = courses.filter((c) => c.progress === 100);
  const certs = completed.length;

  const kpis = [
    { label: "Assigned", value: assigned.length, icon: ClipboardList, color: "text-info", bg: "bg-info/10" },
    { label: "In progress", value: inProgress.length, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Certificates", value: certs, icon: Award, color: "text-warning", bg: "bg-warning/15" },
  ];

  const mandatory = courses.filter((c) => c.mandatory);
  const optional = courses.filter((c) => !c.mandatory);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your training at a glance</p>
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
                <div className={`p-2 rounded-lg ${k.bg}`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Continue learning</CardTitle>
          <Link to="/courses" className="text-xs text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inProgress.map((c) => (
            <Link key={c.id} to="/courses/$courseId" params={{ courseId: c.id }} className="rounded-lg border p-4 hover:border-primary hover:shadow-sm transition">
              <div className="flex gap-3">
                <img src={c.thumbnail} alt="" className="h-16 w-24 rounded object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{c.category}</div>
                  <div className="font-medium text-sm line-clamp-2">{c.title}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{c.progress}%</span>
                  {c.dueDate && <span>Due {c.dueDate}</span>}
                </div>
                <Progress value={c.progress} className="h-1.5" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Mandatory</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {mandatory.map((c) => <MiniRow key={c.id} course={c} accent="destructive" />)}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Optional</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {optional.map((c) => <MiniRow key={c.id} course={c} accent="info" />)}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm">{a.text}</div>
                    <div className="text-xs text-muted-foreground">{a.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniRow({ course, accent }: { course: typeof courses[number]; accent: "destructive" | "info" }) {
  return (
    <Link to="/courses/$courseId" params={{ courseId: course.id }} className="flex items-center gap-3 p-2 -mx-2 rounded hover:bg-accent/40 transition">
      <div className={`h-9 w-9 rounded flex items-center justify-center bg-${accent}/15`}>
        <TrendingUp className={`h-4 w-4 text-${accent}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{course.title}</div>
        <div className="text-xs text-muted-foreground">{course.progress}% · {course.duration}</div>
      </div>
      {course.progress === 100 && <Badge variant="secondary" className="text-success">Done</Badge>}
    </Link>
  );
}
