import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/hr/assign")({
  head: () => ({ meta: [{ title: "Assign Training — Learning Hub Connect" }] }),
  component: AssignPage,
});

type Course = { id: string; title: string; category: string; estimated_minutes: number; status: string };
type Department = { id: string; name: string };
type Team = { id: string; name: string };
type Learner = { id: string; full_name: string; email: string; department_id: string | null };
type Target = { type: "department" | "team" | "individual"; id: string; label: string };
const steps = ["Select course", "Choose audience", "Set rules", "Review & publish"];

function AssignPage() {
  const { allowed } = useAuthGuard("hr");
  const [step, setStep] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [courseId, setCourseId] = useState("");
  const [targets, setTargets] = useState<Target[]>([]);
  const [mandatory, setMandatory] = useState(true);
  const [allowUnenroll, setAllowUnenroll] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const selectedCourse = courses.find((course) => course.id === courseId);
  const filteredLearners = useMemo(() => learners.filter((learner) =>
    (learner.full_name + " " + learner.email).toLowerCase().includes(search.toLowerCase())), [learners, search]);

  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const supabase = getSupabase();
        const [courseRes, departmentRes, teamRes, learnerRes] = await Promise.all([
          supabase.from("courses").select("id,title,category,estimated_minutes,status").eq("status","published").order("title"),
          supabase.from("departments").select("id,name").order("name"),
          supabase.from("teams").select("id,name").order("name"),
          supabase.from("profiles").select("id,full_name,email,department_id").eq("role","learner").eq("is_active",true).order("full_name"),
        ]);
        for (const result of [courseRes, departmentRes, teamRes, learnerRes]) if (result.error) throw result.error;
        if (!alive) return;
        setCourses(courseRes.data ?? []); setDepartments(departmentRes.data ?? []);
        setTeams(teamRes.data ?? []); setLearners(learnerRes.data ?? []);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load assignment data"); }
      finally { if (alive) setLoading(false); }
    };
    void load();
    return () => { alive = false; };
  }, [allowed]);

  const toggleTarget = (target: Target) => setTargets((current) =>
    current.some((item) => item.type === target.type && item.id === target.id)
      ? current.filter((item) => !(item.type === target.type && item.id === target.id))
      : [...current, target]);

  const canContinue = step === 0 ? !!courseId : step === 1 ? targets.length > 0 : step === 2 ? true : true;

  const publish = async () => {
    if (!courseId || targets.length === 0) return;
    setSaving(true);
    try {
      const dueAt = deadline ? new Date(deadline + "T23:59:59").toISOString() : null;
      const { data, error } = await getSupabase().rpc("publish_course_assignment", {
        p_course_id: courseId,
        p_title: title.trim() || null,
        p_is_mandatory: mandatory,
        p_allow_self_unenroll: mandatory ? false : allowUnenroll,
        p_due_at: dueAt,
        p_targets: targets.map(({ type, id }) => ({ type, id })),
      });
      if (error) throw error;
      const result = data as { assignment_id: string; enrollments_created: number };
      toast.success("Training published to " + result.enrollments_created + " learners.");
      setCourseId(""); setTargets([]); setDeadline(""); setTitle(""); setMandatory(true); setAllowUnenroll(false); setStep(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish assignment");
    } finally { setSaving(false); }
  };

  if (!allowed) return null;
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Assign Training</h1><p className="text-sm text-muted-foreground">Publish a course to departments, teams or individual learners.</p></div>
      <Card><CardContent className="p-4 overflow-x-auto"><ol className="flex items-center gap-2 min-w-max">{steps.map((label,index)=><li key={label} className="flex items-center gap-2">
        <button type="button" onClick={()=>index<=step && setStep(index)} className={"rounded-full px-3 py-2 text-sm flex items-center gap-2 "+(step===index?"bg-primary text-primary-foreground":step>index?"bg-primary/10 text-primary":"bg-muted text-muted-foreground")}><span className="h-5 w-5 rounded-full grid place-items-center bg-background/20">{step>index?<Check className="h-3 w-3"/>:index+1}</span>{label}</button>{index<steps.length-1&&<ChevronRight className="h-4 w-4 text-muted-foreground"/>}
      </li>)}</ol></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-base">Step {step+1}: {steps[step]}</CardTitle></CardHeader><CardContent className="space-y-5">
        {loading ? <div className="py-10 text-center text-sm text-muted-foreground">Loading your organization data…</div> : null}
        {!loading && step===0 && (courses.length===0 ? <p className="text-sm text-muted-foreground">There are no published courses yet. Create and publish a course in the Course Catalog first.</p> :
          <div className="grid gap-3 sm:grid-cols-2">{courses.map((course)=><button type="button" key={course.id} onClick={()=>setCourseId(course.id)} className={"rounded-lg border p-4 text-left transition "+(courseId===course.id?"border-primary ring-2 ring-primary/20 bg-primary/5":"hover:border-primary/50")}>
            <div className="flex items-center justify-between gap-2"><Badge variant="secondary">{course.category}</Badge>{courseId===course.id&&<Check className="h-4 w-4 text-primary"/>}</div><div className="font-medium mt-2">{course.title}</div><div className="text-xs text-muted-foreground mt-1">{course.estimated_minutes} minutes</div>
          </button>)}</div>)}
        {!loading && step===1 && <div className="space-y-6">
          <div><div className="font-medium text-sm mb-2">Departments</div><div className="grid gap-2 sm:grid-cols-2">{departments.map((department)=><TargetButton key={department.id} label={department.name} selected={targets.some((t)=>t.type==="department"&&t.id===department.id)} onClick={()=>toggleTarget({type:"department",id:department.id,label:department.name})}/>)}</div></div>
          <div><div className="font-medium text-sm mb-2">Teams</div><div className="flex flex-wrap gap-2">{teams.map((team)=><TargetButton key={team.id} label={team.name} selected={targets.some((t)=>t.type==="team"&&t.id===team.id)} onClick={()=>toggleTarget({type:"team",id:team.id,label:team.name})}/>)}</div></div>
          <div><div className="font-medium text-sm mb-2">Individual learners</div><Input placeholder="Search learners by name or email" value={search} onChange={(e)=>setSearch(e.target.value)} /><div className="mt-2 max-h-64 overflow-y-auto divide-y rounded-md border">{filteredLearners.map((learner)=><label key={learner.id} className="flex items-center gap-3 p-3 text-sm cursor-pointer hover:bg-muted/50"><input type="checkbox" checked={targets.some((t)=>t.type==="individual"&&t.id===learner.id)} onChange={()=>toggleTarget({type:"individual",id:learner.id,label:learner.full_name||learner.email})}/><span className="flex-1"><span className="block font-medium">{learner.full_name||"Unnamed learner"}</span><span className="text-xs text-muted-foreground">{learner.email}</span></span></label>)}</div></div>
          <div className="rounded-md bg-muted p-3 text-sm"><strong>{targets.length}</strong> audience groups or individual learners selected. Learners appearing in multiple selections will receive only one enrollment.</div>
        </div>}
        {!loading && step===2 && <div className="space-y-4 max-w-xl">
          <div className="space-y-2"><Label htmlFor="assignment-title">Assignment name (optional)</Label><Input id="assignment-title" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder={selectedCourse?.title}/></div>
          <div className="flex items-center justify-between rounded-lg border p-4"><div><div className="font-medium text-sm">Mandatory training</div><p className="text-xs text-muted-foreground">Track completion as a compliance requirement.</p></div><Switch checked={mandatory} onCheckedChange={setMandatory}/></div>
          {!mandatory&&<div className="flex items-center justify-between rounded-lg border p-4"><div><div className="font-medium text-sm">Allow self-unenroll</div><p className="text-xs text-muted-foreground">Learners may remove this optional assignment.</p></div><Switch checked={allowUnenroll} onCheckedChange={setAllowUnenroll}/></div>}
          <div className="space-y-2"><Label htmlFor="deadline">Completion deadline (optional)</Label><Input id="deadline" type="date" min={new Date().toISOString().slice(0,10)} value={deadline} onChange={(e)=>setDeadline(e.target.value)}/><p className="text-xs text-muted-foreground">In-app notifications will be created for each learner. Email delivery will be connected separately.</p></div>
        </div>}
        {!loading && step===3 && <div className="space-y-3">
          <ReviewRow label="Course" value={selectedCourse?.title||"Not selected"}/><ReviewRow label="Audience" value={targets.map((t)=>t.label).join(", ")}/><ReviewRow label="Assignment type" value={mandatory?"Mandatory":"Optional"}/><ReviewRow label="Self-unenroll" value={mandatory?"Not allowed":allowUnenroll?"Allowed":"Not allowed"}/><ReviewRow label="Deadline" value={deadline||"No deadline"}/>
          <div className="rounded-md bg-muted p-3 text-sm">Publishing creates a permanent assignment, generates learner enrollments and writes in-app notifications in your organization.</div>
        </div>}
      </CardContent></Card>

      <div className="flex justify-between"><Button variant="outline" disabled={step===0||saving} onClick={()=>setStep((value)=>value-1)}><ChevronLeft className="h-4 w-4 mr-1"/>Back</Button>
        {step<3?<Button disabled={!canContinue||loading||saving} onClick={()=>setStep((value)=>value+1)}>Continue<ChevronRight className="h-4 w-4 ml-1"/></Button>:<Button disabled={saving||loading} onClick={()=>void publish()}>{saving&&<Loader2 className="h-4 w-4 mr-2 animate-spin"/>}Publish assignment</Button>}
      </div>
    </div>
  );
}

function TargetButton({label,selected,onClick}:{label:string;selected:boolean;onClick:()=>void}) {
  return <button type="button" onClick={onClick} className={"rounded-md border px-3 py-2 text-sm text-left flex items-center justify-between gap-2 "+(selected?"border-primary bg-primary/5 text-primary":"hover:bg-muted/50")}>{label}{selected&&<Check className="h-4 w-4"/>}</button>;
}
function ReviewRow({label,value}:{label:string;value:string}) {
  return <div className="flex justify-between gap-4 border-b py-2 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-right max-w-[70%]">{value}</span></div>;
}
