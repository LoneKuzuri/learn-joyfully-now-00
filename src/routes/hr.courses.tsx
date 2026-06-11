import { createFileRoute, Link } from "@tanstack/react-router";
import { courses } from "@/lib/lms-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/hr/courses")({
  head: () => ({ meta: [{ title: "Course Catalog — HR" }] }),
  component: HRCoursesPage,
});

function HRCoursesPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Course Catalog</h1>
          <p className="text-sm text-muted-foreground">{courses.length} active courses</p>
        </div>
        <Button asChild><Link to="/hr/assign">Assign a course</Link></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <img src={c.thumbnail} alt="" className="h-32 w-full object-cover" />
            <CardContent className="p-4 space-y-2">
              <Badge variant="secondary">{c.category}</Badge>
              <div className="font-medium">{c.title}</div>
              <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              <div className="text-xs text-muted-foreground">{c.duration} · {c.instructor}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
