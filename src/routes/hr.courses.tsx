import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuth, canManageCourses } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, Plus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/hr/courses")({
  head: () => ({ meta: [{ title: "Course Catalog — Learning Hub Connect" }] }),
  component: HRCoursesPage,
});

type CourseRow = {
  id: string; title: string; category: string; description: string;
  estimated_minutes: number; status: "draft" | "published" | "archived"; passing_score: number;
};

function HRCoursesPage() {
  const { allowed } = useAuthGuard("hr");
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [passingScore, setPassingScore] = useState("70");
  const [modulesText, setModulesText] = useState("Introduction\nKey concepts\nKnowledge check");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const canCreate = !!user && canManageCourses(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await getSupabase().from("courses")
        .select("id,title,category,description,estimated_minutes,status,passing_score")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCourses((data ?? []) as CourseRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load courses");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (allowed) void load(); }, [allowed]);

  const createCourse = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.organizationId) { toast.error("Your account is not linked to an organization."); return; }
    const moduleTitles = modulesText.split("\n").map((item) => item.trim()).filter(Boolean);
    if (!moduleTitles.length) { toast.error("Add at least one learning module."); return; }
    setSaving(true);
    try {
      const supabase = getSupabase();
      const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
      const { data: course, error } = await supabase.from("courses").insert({
        organization_id: user.organizationId, created_by: user.id, title: title.trim(), slug,
        category: category.trim() || "General", description: description.trim(),
        estimated_minutes: Math.max(0, Number(minutes) || 0),
        passing_score: Math.min(100, Math.max(0, Number(passingScore) || 70)),
        status,
      }).select("id").single();
      if (error) throw error;
      const modules = moduleTitles.map((moduleTitle, index) => ({
        course_id: course.id, title: moduleTitle, kind: "text" as const,
        position: index, estimated_minutes: 10, is_required: true,
        body: "Learning content can be added to this module from the course editor.",
      }));
      const { error: moduleError } = await supabase.from("course_modules").insert(modules);
      if (moduleError) throw moduleError;
      toast.success(status === "published" ? "Course created and published" : "Draft course created");
      setTitle(""); setDescription(""); setShowForm(false); await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create course");
    } finally { setSaving(false); }
  };

  if (!allowed) return null;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Course Catalog</h1><p className="text-sm text-muted-foreground">Create and manage organization learning content.</p></div>
        {canCreate && <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4 mr-1" />{showForm ? "Close form" : "Create course"}</Button>}
      </div>

      {showForm && canCreate && (
        <Card><CardContent className="p-5">
          <form onSubmit={createCourse} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="course-title">Course title</Label><Input id="course-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Workplace Safety Essentials" /></div>
              <div className="space-y-2"><Label htmlFor="course-category">Category</Label><Input id="course-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Compliance, Leadership, Technical…" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="course-description">Description</Label><Textarea id="course-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="course-minutes">Estimated minutes</Label><Input id="course-minutes" type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="passing-score">Passing score (%)</Label><Input id="passing-score" type="number" min="0" max="100" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="course-status">Publication status</Label><select id="course-status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}><option value="draft">Save as draft</option><option value="published">Publish course</option></select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="module-titles">Learning modules (one title per line)</Label><Textarea id="module-titles" rows={5} value={modulesText} onChange={(e) => setModulesText(e.target.value)} /><p className="text-xs text-muted-foreground">This creates the course structure. Add lesson content and assessments in the next course-editor phase.</p></div>
            <div className="flex justify-end"><Button type="submit" disabled={saving || !title.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{saving ? "Saving…" : "Create course"}</Button></div>
          </form>
        </CardContent></Card>
      )}

      {loading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading course catalog…</div> : courses.length === 0 ? (
        <Card><CardContent className="py-14 text-center"><BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-3" /><div className="font-medium">No courses created yet</div><p className="text-sm text-muted-foreground mt-1">Create your first course to start building the training catalog.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => <Card key={course.id}><CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-2"><Badge variant="secondary">{course.category}</Badge><Badge variant={course.status === "published" ? "default" : "outline"}>{course.status}</Badge></div>
            <div className="font-semibold">{course.title}</div><p className="text-sm text-muted-foreground line-clamp-3">{course.description || "No description provided."}</p>
            <div className="text-xs text-muted-foreground">{course.estimated_minutes} min · Pass mark {course.passing_score}%</div>
          </CardContent></Card>)}
        </div>
      )}
    </div>
  );
}
