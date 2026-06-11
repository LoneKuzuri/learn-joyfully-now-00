import { createFileRoute, Link } from "@tanstack/react-router";
import { courses, recentActivity } from "@/lib/lms-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, PlayCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — LearnHub" },
      { name: "description", content: "Your personalized learning hub. Assigned, in-progress, and recommended courses in one place." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const assigned = courses.filter((c) => c.mandatory);
  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100);
  const recommended = courses.filter((c) => !c.mandatory).slice(0, 3);
  const upcoming = courses.filter((c) => c.dueDate).slice(0, 3);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-info text-primary-foreground p-8">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-white/15 hover:bg-white/20 text-primary-foreground border-0 mb-3">
            <Sparkles className="h-3 w-3 mr-1" /> Welcome back
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Hello, Alex 👋</h1>
          <p className="mt-2 text-primary-foreground/85">
            You have <strong>{assigned.length} assigned courses</strong> and{" "}
            <strong>{inProgress.length} in progress</strong>. Let's keep the streak going.
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <Link to="/dashboard">Go to dashboard <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to="/courses">Browse catalog</Link>
            </Button>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute right-20 bottom-0 h-40 w-40 rounded-full bg-white/5" />
      </section>

      {/* Assigned */}
      <Section title="Assigned to you" subtitle="Mandatory training with active deadlines">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assigned.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </Section>

      {/* Continue Learning */}
      <Section title="Continue learning" subtitle="Pick up where you left off">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inProgress.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recommended for you</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommended.map((c) => (
              <Link key={c.id} to="/courses/$courseId" params={{ courseId: c.id }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/40 transition">
                <img src={c.thumbnail} alt="" className="h-14 w-20 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.category} · {c.duration}</div>
                </div>
                <PlayCircle className="h-5 w-5 text-primary" />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-md bg-warning/15 text-warning-foreground">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground">Due {c.dueDate}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>{a.text}</span>
                <span className="text-muted-foreground text-xs">{a.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function CourseCard({ course }: { course: typeof courses[number] }) {
  return (
    <Link to="/courses/$courseId" params={{ courseId: course.id }} className="group">
      <Card className="overflow-hidden h-full transition hover:shadow-md hover:-translate-y-0.5">
        <div className="relative h-32">
          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
          {course.mandatory && (
            <Badge className="absolute top-2 left-2 bg-destructive/90 text-destructive-foreground border-0">Mandatory</Badge>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">{course.category}</div>
            <div className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition">{course.title}</div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{course.progress}% complete</span>
              <span>{course.duration}</span>
            </div>
            <Progress value={course.progress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
