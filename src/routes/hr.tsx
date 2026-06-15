import { createFileRoute, Link } from "@tanstack/react-router";
import { departments, recentAssignments, courses } from "@/lib/lms-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ClipboardList, BarChart3, AlertTriangle, BookOpen, Plus, Users } from "lucide-react";

export const Route = createFileRoute("/hr")({
  head: () => ({
    meta: [
      { title: "HR Console — LearnHub" },
      { name: "description", content: "Training overview, completion rates, and quick actions for HR administrators." },
    ],
  }),
  component: HRLandingPage,
});

function HRLandingPage() {
  const { allowed } = useAuthGuard("hr");
  if (!allowed) return null;
  const avgCompletion = Math.round(departments.reduce((s, d) => s + d.completion, 0) / departments.length);
  const totalLearners = departments.reduce((s, d) => s + d.learners, 0);
  const totalOverdue = departments.reduce((s, d) => s + d.overdue, 0);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sidebar via-sidebar to-primary text-primary-foreground p-8">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-white/15 border-0 text-primary-foreground mb-3">HR Administrator</Badge>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Training overview</h1>
          <p className="mt-2 text-primary-foreground/85">
            {totalLearners} learners across {departments.length} departments. Average completion {avgCompletion}%.
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <Link to="/hr/dashboard">Open dashboard <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to="/hr/assign"><Plus className="h-4 w-4 mr-1" /> Assign training</Link>
            </Button>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10" />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickStat icon={Users} label="Active learners" value={totalLearners} tone="info" />
        <QuickStat icon={BarChart3} label="Avg completion" value={`${avgCompletion}%`} tone="success" />
        <QuickStat icon={AlertTriangle} label="Overdue" value={totalOverdue} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Department performance</CardTitle>
            <Link to="/hr/dashboard" className="text-xs text-primary hover:underline">View dashboard</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {departments.slice(0, 5).map((d) => (
              <div key={d.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">{d.completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${d.completion}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Quick actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <QuickAction to="/hr/assign" icon={ClipboardList} label="Assign course" desc="To teams or users" />
            <QuickAction to="/hr/dashboard" icon={BarChart3} label="View analytics" desc="Completion & engagement" />
            <QuickAction to="/hr/reports" icon={Users} label="Overdue learners" desc={`${totalOverdue} pending`} />
            <QuickAction to="/hr/courses" icon={BookOpen} label="Course catalog" desc={`${courses.length} courses`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent assignments</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y">
            {recentAssignments.map((a, i) => (
              <li key={i} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{a.course}</div>
                  <div className="text-xs text-muted-foreground">{a.assignedTo}</div>
                </div>
                <Badge variant="secondary">{a.date}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: "info" | "success" | "warning" }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-3xl font-semibold mt-1">{value}</div>
        </div>
        <div className={`p-3 rounded-lg bg-${tone}/15`}><Icon className={`h-6 w-6 text-${tone}`} /></div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ to, icon: Icon, label, desc }: { to: string; icon: any; label: string; desc: string }) {
  return (
    <Link to={to} className="rounded-lg border p-4 hover:border-primary hover:bg-accent/40 transition">
      <Icon className="h-5 w-5 text-primary mb-2" />
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
