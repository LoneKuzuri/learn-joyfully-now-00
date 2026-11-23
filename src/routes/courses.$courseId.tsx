import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  FileText,
  PlayCircle,
  ChevronLeft,
  Loader2,
  ClipboardCheck,
} from "lucide-react";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({ meta: [{ title: "Course Player — Learning Hub Connect" }] }),
  component: CoursePlayerPage,
});

type Course = {
  id: string;
  title: string;
  category: string;
  description: string;
  passing_score: number;
};
type Module = {
  id: string;
  title: string;
  kind: "video" | "scorm" | "pdf" | "text" | "quiz";
  content_url: string | null;
  body: string | null;
  position: number;
  estimated_minutes: number;
};
type Question = {
  id: string;
  prompt: string;
  kind: "single_choice" | "multiple_choice" | "true_false";
  options: unknown;
  points: number;
};
type Quiz = { id: string; module_id: string; max_attempts: number | null };

function CoursePlayerPage() {
  const { allowed } = useAuthGuard("learner");
  const { user } = useAuth();
  const { courseId } = useParams({ from: "/courses/$courseId" });
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [activeId, setActiveId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ score_percent: number; passed: boolean } | null>(null);
  const [note, setNote] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = getSupabase();
      const [courseRes, enrollmentRes, moduleRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id,title,category,description,passing_score")
          .eq("id", courseId)
          .single(),
        supabase
          .from("enrollments")
          .select("id,status,progress_percent,due_at")
          .eq("course_id", courseId)
          .eq("learner_id", user.id)
          .single(),
        supabase
          .from("course_modules")
          .select("id,title,kind,content_url,body,position,estimated_minutes")
          .eq("course_id", courseId)
          .order("position"),
      ]);
      if (courseRes.error) throw courseRes.error;
      if (enrollmentRes.error) throw new Error("This course is not assigned to your account.");
      if (moduleRes.error) throw moduleRes.error;
      setCourse(courseRes.data as Course);
      setEnrollmentId(enrollmentRes.data.id);
      setModules((moduleRes.data ?? []) as Module[]);
      setActiveId((moduleRes.data ?? [])[0]?.id ?? "");
      const quizModuleIds = (moduleRes.data ?? [])
        .filter((m) => m.kind === "quiz")
        .map((m) => m.id);
      const [progressRes, quizRes] = await Promise.all([
        supabase
          .from("module_progress")
          .select("module_id,completed_at")
          .eq("enrollment_id", enrollmentRes.data.id),
        quizModuleIds.length
          ? supabase
              .from("quizzes")
              .select("id,module_id,max_attempts")
              .in("module_id", quizModuleIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (progressRes.error) throw progressRes.error;
      if (quizRes.error) throw quizRes.error;
      setProgress(
        Object.fromEntries(
          (progressRes.data ?? []).filter((p) => p.completed_at).map((p) => [p.module_id, true]),
        ),
      );
      setQuizzes(Object.fromEntries((quizRes.data ?? []).map((q) => [q.module_id, q as Quiz])));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load course");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed && user) void load();
  }, [allowed, user?.id, courseId]);

  const active = modules.find((m) => m.id === activeId);
  const doneCount = modules.filter((m) => progress[m.id]).length;
  const percent = modules.length ? Math.round((doneCount / modules.length) * 100) : 0;

  useEffect(() => {
    const run = async () => {
      if (!active || active.kind !== "quiz") {
        setQuestions([]);
        return;
      }
      const quiz = quizzes[active.id];
      if (!quiz) {
        setQuestions([]);
        return;
      }
      const { data, error } = await getSupabase()
        .from("learner_quiz_questions")
        .select("id,prompt,kind,options,points")
        .eq("quiz_id", quiz.id)
        .order("position");
      if (error) {
        toast.error(error.message);
        return;
      }
      setQuestions((data ?? []) as Question[]);
      setAnswers({});
      setResult(null);
    };
    void run();
  }, [activeId, quizzes]);

  const completeModule = async () => {
    if (!active || !enrollmentId) return;
    setSaving(true);
    try {
      const { error } = await getSupabase().rpc("complete_learning_module", {
        p_enrollment_id: enrollmentId,
        p_module_id: active.id,
        p_position_seconds: 0,
      });
      if (error) throw error;
      setProgress((current) => ({ ...current, [active.id]: true }));
      toast.success("Module completed");
      const next = modules.find((m) => !progress[m.id] && m.id !== active.id);
      if (next) setActiveId(next.id);
      else await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save progress");
    } finally {
      setSaving(false);
    }
  };

  const submitQuiz = async () => {
    if (!active || !enrollmentId) return;
    const quiz = quizzes[active.id];
    if (!quiz) {
      toast.error("Assessment is not configured yet.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await getSupabase().rpc("submit_quiz_attempt", {
        p_enrollment_id: enrollmentId,
        p_quiz_id: quiz.id,
        p_answers: answers,
      });
      if (error) throw error;
      const scored = data as { score_percent: number; passed: boolean; progress_percent: number };
      setResult({ score_percent: scored.score_percent, passed: scored.passed });
      if (scored.passed) {
        setProgress((current) => ({ ...current, [active.id]: true }));
        toast.success("Assessment passed");
      } else toast.error("Assessment not passed. Review the material and try again.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit assessment");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;
  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading your course…</div>;
  if (!course || !enrollmentId)
    return (
      <div className="p-8 space-y-3">
        <p className="font-medium">Course unavailable</p>
        <p className="text-sm text-muted-foreground">
          This course may not be assigned to your account.
        </p>
        <Button asChild variant="outline">
          <Link to="/courses">Back to my courses</Link>
        </Button>
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)]">
      <aside className="lg:w-80 border-r bg-card">
        <div className="p-4 border-b">
          <Link
            to="/courses"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to courses
          </Link>
          <div className="mt-2 text-xs text-muted-foreground">{course.category}</div>
          <h2 className="font-semibold leading-tight">{course.title}</h2>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {doneCount}/{modules.length} modules
              </span>
              <span>{percent}%</span>
            </div>
            <Progress value={percent} className="h-1.5" />
          </div>
        </div>
        <nav className="p-2">
          {modules.map((module, index) => (
            <button
              type="button"
              key={module.id}
              onClick={() => setActiveId(module.id)}
              className={
                "w-full text-left flex items-start gap-3 p-3 rounded-md text-sm transition " +
                (activeId === module.id ? "bg-primary/10 text-primary" : "hover:bg-accent/40")
              }
            >
              {progress[module.id] ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 min-w-0">
                <span className="block font-medium">
                  {index + 1}. {module.title}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {module.kind} · {module.estimated_minutes} min
                </span>
              </span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl">
        {active && (
          <>
            <div>
              <Badge variant="secondary" className="capitalize">
                {active.kind}
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight mt-2">{active.title}</h1>
              <p className="text-sm text-muted-foreground">
                {active.estimated_minutes} minutes · Course pass mark {course.passing_score}%
              </p>
            </div>
            {active.kind === "quiz" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" /> Knowledge assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No questions have been added to this assessment yet.
                    </p>
                  ) : (
                    questions.map((question, index) => {
                      const options = Array.isArray(question.options)
                        ? question.options.map((option) =>
                            typeof option === "string"
                              ? { value: option, label: option }
                              : {
                                  value: String(
                                    (option as { value?: string; id?: string }).value ??
                                      (option as { id?: string }).id ??
                                      "",
                                  ),
                                  label: String(
                                    (option as { label?: string; text?: string }).label ??
                                      (option as { text?: string }).text ??
                                      "",
                                  ),
                                },
                          )
                        : [];
                      return (
                        <div key={question.id} className="space-y-3">
                          <div className="font-medium">
                            {index + 1}. {question.prompt}
                          </div>
                          <div className="space-y-2">
                            {options.map((option) => (
                              <label
                                key={option.value}
                                className="flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer hover:bg-muted/50"
                              >
                                <input
                                  type={question.kind === "multiple_choice" ? "checkbox" : "radio"}
                                  name={question.id}
                                  checked={(answers[question.id] ?? []).includes(option.value)}
                                  onChange={(event) =>
                                    setAnswers((current) => ({
                                      ...current,
                                      [question.id]:
                                        question.kind === "multiple_choice"
                                          ? event.target.checked
                                            ? [...(current[question.id] ?? []), option.value]
                                            : (current[question.id] ?? []).filter(
                                                (v) => v !== option.value,
                                              )
                                          : [option.value],
                                    }))
                                  }
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {result && (
                    <div
                      className={
                        "rounded-lg border p-4 " +
                        (result.passed
                          ? "border-success/40 bg-success/5"
                          : "border-warning/40 bg-warning/5")
                      }
                    >
                      <div className="font-semibold">
                        {result.passed ? "Assessment passed" : "Assessment not passed"}
                      </div>
                      <p className="text-sm mt-1">
                        Your score: {result.score_percent}% · Required: {course.passing_score}%
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => void submitQuiz()}
                    disabled={saving || questions.length === 0 || !!result?.passed}
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit assessment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="min-h-64 bg-muted flex items-center justify-center p-8 text-center">
                    {active.content_url ? (
                      active.kind === "video" ? (
                        <video controls className="max-h-[480px] w-full" src={active.content_url} />
                      ) : (
                        <a
                          className="text-primary underline"
                          href={active.content_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open learning resource
                        </a>
                      )
                    ) : active.kind === "pdf" ? (
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    ) : (
                      <PlayCircle className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                </Card>
                <Card>
                  <CardContent className="p-5 prose prose-sm max-w-none whitespace-pre-wrap">
                    {active.body || "Your instructor has not added lesson content yet."}
                  </CardContent>
                </Card>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => void completeModule()}
                    disabled={saving || !!progress[active.id]}
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {progress[active.id] ? "Module completed" : "Mark complete & continue"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Personal notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Keep notes for this lesson…"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Notes are currently kept in this session only.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
