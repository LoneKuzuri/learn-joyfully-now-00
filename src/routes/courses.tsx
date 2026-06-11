import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { courses } from "@/lib/lms-data";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "My Courses — LearnHub" },
      { name: "description", content: "Browse the full course catalog with filters by category, status, and mandatory training." },
    ],
  }),
  component: CoursesPage,
});

const categories = ["All", "Compliance", "Leadership", "Security", "Onboarding", "Innovation", "Technical"];
const statuses = ["All", "Not started", "In progress", "Completed"] as const;

function CoursesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");

  const filtered = courses.filter((c) => {
    if (cat !== "All" && c.category !== cat) return false;
    if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (status === "Not started" && c.progress !== 0) return false;
    if (status === "In progress" && (c.progress === 0 || c.progress === 100)) return false;
    if (status === "Completed" && c.progress !== 100) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {courses.length} courses</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> Filter:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)} className="h-8">
                {c}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {statuses.map((s) => (
              <Button key={s} size="sm" variant={status === s ? "secondary" : "ghost"} onClick={() => setStatus(s)} className="h-8">
                {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.id} className="overflow-hidden flex flex-col">
            <div className="relative h-36">
              <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
              <div className="absolute top-2 left-2 flex gap-1.5">
                {c.mandatory && <Badge className="bg-destructive/90 border-0 text-destructive-foreground">Mandatory</Badge>}
                <Badge variant="secondary">{c.category}</Badge>
              </div>
            </div>
            <CardContent className="p-4 flex flex-col flex-1">
              <div className="font-semibold leading-snug">{c.title}</div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
              <div className="mt-3 text-xs text-muted-foreground flex justify-between">
                <span>{c.duration} · {c.instructor}</span>
                {c.dueDate && <span className="text-warning font-medium">Due {c.dueDate}</span>}
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{c.progress}% complete</span>
                </div>
                <Progress value={c.progress} className="h-1.5" />
              </div>
              <Button asChild className="mt-4 w-full" variant={c.progress === 100 ? "outline" : "default"}>
                <Link to="/courses/$courseId" params={{ courseId: c.id }}>
                  {c.progress === 0 ? "Start" : c.progress === 100 ? "Review" : "Continue"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
