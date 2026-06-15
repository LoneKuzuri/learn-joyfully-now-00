import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { courses, departments } from "@/lib/lms-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/assign")({
  head: () => ({
    meta: [
      { title: "Assign Courses — LearnHub" },
      { name: "description", content: "Multi-step workflow to assign courses to departments, teams, or individuals." },
    ],
  }),
  component: AssignPage,
});

const STEPS = [
  "Select course",
  "Audience",
  "Settings",
  "Deadline",
  "Notify",
  "Review",
];

const teams = ["Frontend Guild", "Account Executives", "Customer Success", "Data Platform"];
const individuals = [
  "Jordan Alvarez", "Mei Watanabe", "Lucas Beck", "Fatima Noor", "Sarah Linwood", "David Chen",
];

function AssignPage() {
  const { allowed } = useAuthGuard("hr");
  const [step, setStep] = useState(0);
  if (!allowed) return null;
  const [courseId, setCourseId] = useState<string | null>(null);
  const [selDept, setSelDept] = useState<string[]>([]);
  const [selTeams, setSelTeams] = useState<string[]>([]);
  const [selUsers, setSelUsers] = useState<string[]>([]);
  const [mandatory, setMandatory] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [notify, setNotify] = useState(true);
  const [notifyMsg, setNotifyMsg] = useState(
    "You've been assigned a new training. Please complete it by the deadline below.",
  );

  const course = courses.find((c) => c.id === courseId);
  const totalAudience =
    selDept.reduce((s, id) => s + (departments.find((d) => d.id === id)?.learners ?? 0), 0) +
    selTeams.length * 12 +
    selUsers.length;

  const canNext = () => {
    if (step === 0) return !!courseId;
    if (step === 1) return totalAudience > 0;
    if (step === 3) return !!deadline;
    return true;
  };

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = () => {
    toast.success(`Assigned "${course?.title}" to ${totalAudience} learners`);
    setStep(0);
    setCourseId(null);
    setSelDept([]);
    setSelTeams([]);
    setSelUsers([]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assign Courses</h1>
        <p className="text-sm text-muted-foreground">Push training to departments, teams, or individuals</p>
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <ol className="flex items-center gap-2 min-w-max">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s} className="flex items-center gap-2">
                  <button
                    onClick={() => i <= step && setStep(i)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition ${
                      active ? "bg-primary text-primary-foreground" : done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      active ? "bg-white/20" : done ? "bg-success text-success-foreground" : "bg-background"
                    }`}>
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    {s}
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Step {step + 1}: {STEPS[step]}</CardTitle></CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCourseId(c.id)}
                  className={`text-left rounded-lg border p-3 transition ${
                    courseId === c.id ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex gap-3">
                    <img src={c.thumbnail} alt="" className="h-14 w-20 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">{c.category}</div>
                      <div className="font-medium text-sm">{c.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.duration}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <AudienceGroup title="Departments">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {departments.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-accent/40">
                      <Checkbox checked={selDept.includes(d.id)} onCheckedChange={() => toggle(selDept, setSelDept, d.id)} />
                      <div className="text-sm">
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.learners} learners</div>
                      </div>
                    </label>
                  ))}
                </div>
              </AudienceGroup>
              <AudienceGroup title="Teams">
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => (
                    <Button key={t} size="sm" variant={selTeams.includes(t) ? "default" : "outline"} onClick={() => toggle(selTeams, setSelTeams, t)}>
                      {selTeams.includes(t) && <Check className="h-3 w-3 mr-1" />} {t}
                    </Button>
                  ))}
                </div>
              </AudienceGroup>
              <AudienceGroup title="Individual users">
                <div className="flex flex-wrap gap-2">
                  {individuals.map((u) => (
                    <Button key={u} size="sm" variant={selUsers.includes(u) ? "secondary" : "ghost"} onClick={() => toggle(selUsers, setSelUsers, u)} className="border">
                      {selUsers.includes(u) && <Check className="h-3 w-3 mr-1" />} {u}
                    </Button>
                  ))}
                </div>
              </AudienceGroup>
              <div className="rounded-md bg-info/10 text-info-foreground p-3 text-sm">
                <strong className="text-info">{totalAudience}</strong> learners selected
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 max-w-md">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <div className="font-medium text-sm">Mandatory training</div>
                  <div className="text-xs text-muted-foreground">Learners must complete; non-completion is tracked.</div>
                </div>
                <Switch checked={mandatory} onCheckedChange={setMandatory} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <div className="font-medium text-sm">Allow self-unenroll</div>
                  <div className="text-xs text-muted-foreground">Learners may opt out if not mandatory.</div>
                </div>
                <Switch disabled={mandatory} defaultChecked={!mandatory} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 max-w-md">
              <Label>Completion deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              <p className="text-xs text-muted-foreground">Reminders are sent at 14, 7, and 1 day before the deadline.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <div className="font-medium text-sm">Notify users by email</div>
                  <div className="text-xs text-muted-foreground">Send an assignment email immediately.</div>
                </div>
                <Switch checked={notify} onCheckedChange={setNotify} />
              </div>
              {notify && (
                <div>
                  <Label className="mb-1.5 block">Message preview</Label>
                  <Textarea rows={5} value={notifyMsg} onChange={(e) => setNotifyMsg(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <ReviewRow label="Course" value={course?.title ?? "—"} />
              <ReviewRow label="Audience" value={`${totalAudience} learners (${selDept.length} depts, ${selTeams.length} teams, ${selUsers.length} users)`} />
              <ReviewRow label="Type" value={<Badge variant={mandatory ? "default" : "secondary"}>{mandatory ? "Mandatory" : "Optional"}</Badge>} />
              <ReviewRow label="Deadline" value={deadline || "—"} />
              <ReviewRow label="Notification" value={notify ? "Email on assign" : "No notification"} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            Continue <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit}><Check className="h-4 w-4 mr-1" /> Assign training</Button>
        )}
      </div>
    </div>
  );
}

function AudienceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b last:border-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-right">{value}</div>
    </div>
  );
}
