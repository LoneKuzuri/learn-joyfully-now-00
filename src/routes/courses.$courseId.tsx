import { createFileRoute, Link, useParams, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { courses } from "@/lib/lms-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle, FileText, PlayCircle, Download, MessageSquare, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export const Route = createFileRoute("/courses/$courseId")({
  head: ({ params }) => {
    const c = courses.find((x) => x.id === params.courseId);
    return {
      meta: [
        { title: `${c?.title ?? "Course"} — LearnHub` },
        { name: "description", content: c?.description ?? "Course player" },
      ],
    };
  },
  component: CoursePlayerPage,
  notFoundComponent: () => <div className="p-8">Course not found.</div>,
  loader: ({ params }) => {
    const c = courses.find((x) => x.id === params.courseId);
    if (!c) throw notFound();
    return c;
  },
});

function CoursePlayerPage() {
  const { allowed } = useAuthGuard("learner");
  const { courseId } = useParams({ from: "/courses/$courseId" });
  const course = courses.find((c) => c.id === courseId)!;
  const [activeId, setActiveId] = useState(course.modules.find((m) => !m.completed)?.id ?? course.modules[0].id);
  const [completed, setCompleted] = useState<Record<string, boolean>>(
    Object.fromEntries(course.modules.map((m) => [m.id, m.completed])),
  );

  const activeModule = course.modules.find((m) => m.id === activeId)!;
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((doneCount / course.modules.length) * 100);
  if (!allowed) return null;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">
      {/* Modules sidebar */}
      <aside className="lg:w-80 border-r bg-card">
        <div className="p-4 border-b">
          <Link to="/courses" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to courses
          </Link>
          <div className="mt-2 text-xs text-muted-foreground">{course.category}</div>
          <h2 className="font-semibold leading-tight">{course.title}</h2>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{doneCount}/{course.modules.length} modules</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
        <nav className="p-2">
          {course.modules.map((m, i) => {
            const isDone = completed[m.id];
            const isActive = m.id === activeId;
            return (
              <button
                key={m.id}
                onClick={() => setActiveId(m.id)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-md text-sm transition ${
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-accent/40"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium leading-tight">{i + 1}. {m.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 capitalize">{m.type} · {m.duration}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Player */}
      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl">
        <div>
          <Badge variant="secondary" className="capitalize">{activeModule.type}</Badge>
          <h1 className="text-2xl font-semibold tracking-tight mt-2">{activeModule.title}</h1>
          <p className="text-sm text-muted-foreground">{activeModule.duration} · Instructor: {course.instructor}</p>
        </div>

        <Card className="overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
            <div className="text-center">
              {activeModule.type === "pdf" ? (
                <FileText className="h-16 w-16 mx-auto mb-3 opacity-80" />
              ) : (
                <PlayCircle className="h-20 w-20 mx-auto mb-3 opacity-90" />
              )}
              <div className="text-sm opacity-80">
                {activeModule.type === "video" && "Video lesson"}
                {activeModule.type === "scorm" && "SCORM interactive content"}
                {activeModule.type === "pdf" && "PDF document"}
                {activeModule.type === "quiz" && "Knowledge check"}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setCompleted((p) => ({ ...p, [activeId]: true }));
              toast.success("Module marked complete");
              const idx = course.modules.findIndex((m) => m.id === activeId);
              if (idx < course.modules.length - 1) setActiveId(course.modules[idx + 1].id);
            }}
            disabled={completed[activeId]}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {completed[activeId] ? "Module completed" : "Mark complete & continue"}
          </Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-1.5" /> Resources</Button>
        </div>

        <Tabs defaultValue="notes">
          <TabsList>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <Textarea placeholder="Take notes for this module…" rows={5} />
                <Button size="sm" className="mt-3">Save note</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="resources" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                {["Slide deck.pdf", "Reference handbook.pdf", "Worked examples.xlsx"].map((r) => (
                  <div key={r} className="flex items-center justify-between p-2 rounded hover:bg-accent/40">
                    <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" /> {r}</div>
                    <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="discussion" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Cohort discussion</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <DiscussionPost name="Priya N." time="3h ago" text="Great breakdown in section 2 — the GDPR examples really clicked." />
                <DiscussionPost name="Marco R." time="Yesterday" text="Anyone else struggle with module 3? Let's pair up." />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DiscussionPost({ name, time, text }: { name: string; time: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
        {name.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="text-xs"><span className="font-medium">{name}</span> <span className="text-muted-foreground">· {time}</span></div>
        <div className="text-sm mt-0.5">{text}</div>
      </div>
    </div>
  );
}
