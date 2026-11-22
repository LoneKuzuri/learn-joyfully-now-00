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
  const [modulesText, setModulesText] = useState("Introduction :: Add the key learning points for this lesson.\nKey concepts :: Explain the core concepts and examples.");
  const [includeQuiz, setIncludeQuiz] = useState(true);
  const [quizQuestionsText, setQuizQuestionsText] = useState("Which option best describes the purpose of this training? | Build awareness | Ignore procedures | Build awareness\nWhat should a learner do when unsure? | Ask for guidance | Guess | Ask for guidance");
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
    const moduleItems = modulesText.split("\n").map((line) => {
      const [moduleTitle, ...bodyParts] = line.split("::");
      return { title: moduleTitle.trim(), body: bodyParts.join("::").trim() };
    }).filter((item) => item.title);
    if (!moduleItems.length) { toast.error("Add at least one learning module."); return; }
    const questions = quizQuestionsText.split("\n").map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts.length >= 4 && parts[0]);
    if (includeQuiz && !questions.length) { toast.error("Add at least one assessment question in the required format."); return; }
    if (includeQuiz && questions.some((parts) => !parts.slice(1, -1).includes(parts[parts.length - 1]))) { toast.error("Each correct answer must exactly match one of its answer options."); return; }
    setSaving(true);
    try {
      const supabase = getSupabase();
      const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
      const { data: course, error } = await supabase.from("courses").insert({
        organization_id: user.organizationId, created_by: user.id, instructor_id: user.role === "trainer" ? user.id : null, title: title.trim(), slug,
        category: category.trim() || "General", description: description.trim(),
        estimated_minutes: Math.max(0, Number(minutes) || 0),
        passing_score: Math.min(100, Math.max(0, Number(passingScore) || 70)),
        status,
      }).select("id").single();
      if (error) throw error;
      const modules: { course_id: string; title: string; kind: "text" | "quiz"; position: number; estimated_minutes: number; is_required: boolean; body: string }[] = moduleItems.map((item, index) => ({
        course_id: course.id, title: item.title, kind: "text" as const,
        position: index, estimated_minutes: 10, is_required: true,
        body: item.body || "Your instructor has not added lesson content yet.",
      }));
      if (includeQuiz) modules.push({
        course_id: course.id, title: "Final Assessment", kind: "quiz" as const,
        position: modules.length, estimated_minutes: 15, is_required: true,
        body: "Complete the assessment to finish this course.",
      });
      const { data: createdModules, error: moduleError } = await supabase.from("course_modules").insert(modules).select("id,kind");
      if (moduleError) throw moduleError;
      if (includeQuiz) {
        const quizModule = createdModules?.find((module) => module.kind === "quiz");
        if (!quizModule) throw new Error("Assessment module could not be created.");
        const { data: quiz, error: quizError } = await supabase.from("quizzes").insert({ module_id: quizModule.id, max_attempts: 3 }).select("id").single();
        if (quizError) throw quizError;
        const questionRows = questions.map((parts, index) => ({
          quiz_id: quiz.id, prompt: parts[0], kind: "single_choice" as const,
          options: parts.slice(1, -1), correct_answers: [parts[parts.length - 1]],
          points: 1, position: index,
        }));
        const { error: questionError } = await supabase.from("quiz_questions").insert(questionRows);
        if (questionError) throw questionError;
      }
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
            <div className="space-y-2"><Label htmlFor="module-titles">Learning modules (one per line, use Title :: lesson content)</Label><Textarea id="module-titles" rows={5} value={modulesText} onChange={(e) => setModulesText(e.target.value)} /><p className="text-xs text-muted-foreground">Use “Title :: content” to add text content to each lesson.</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeQuiz} onChange={(e) => setIncludeQuiz(e.target.checked)} /> Include a final assessment (3 attempts)</label>
            {includeQuiz && <div className="space-y-2"><Label htmlFor="quiz-questions">Assessment questions</Label><Textarea id="quiz-questions" rows={5} value={quizQuestionsText} onChange={(e) => setQuizQuestionsText(e.target.value)} /><p className="text-xs text-muted-foreground">One question per line: Question | Option A | Option B | Correct option. The correct option must exactly match one of the choices.</p></div>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeQuiz} onChange={(e) => setIncludeQuiz(e.target.checked)} /> Include a final assessment (3 attempts)</label>
            {includeQuiz && <div className="space-y-2"><Label htmlFor="quiz-questions">Assessment questions</Label><Textarea id="quiz-questions" rows={5} value={quizQuestionsText} onChange={(e) => setQuizQuestionsText(e.target.value)} /><p className="text-xs text-muted-foreground">One question per line: Question | Option A | Option B | Correct option. The correct option must exactly match one of the choices.</p></div>}</div>
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
