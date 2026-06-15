import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, AlertTriangle, ClipboardList, ArrowRight, Sparkles, BookOpen, BarChart3, UserPlus } from "lucide-react";

export const Route = createFileRoute("/hr/dashboard")({
  head: () => ({
    meta: [
      { title: "HR Dashboard — LearnHub" },
      { name: "description", content: "Completion rates, mandatory training status, and department analytics." },
    ],
  }),
  component: HRDashboardPage,
});

function HRDashboardPage() {
  const { user, ready, allowed } = useAuthGuard("hr");
  const { firstTime } = useAuth();
  if (!ready || !allowed || !user) return <Skeleton />;

  const kpis = [
    { label: "Active learners", value: 0, icon: Users, tone: "info" as const },
    { label: "Completion rate", value: "—", icon: CheckCircle2, tone: "success" as const },
    { label: "Overdue", value: 0, icon: AlertTriangle, tone: "warning" as const },
    { label: "Active assignments", value: 0, icon: ClipboardList, tone: "info" as const },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">HR Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome {user.name.split(" ")[0]} — let's set up training for your organization.</p>
        </div>
        {firstTime && <Badge className="shrink-0 gap-1"><Sparkles className="h-3 w-3" /> First login</Badge>}
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">{k.label}</div>
                  <div className="text-2xl sm:text-3xl font-semibold mt-1">{k.value}</div>
                </div>
                <div className={`p-2 rounded-lg shrink-0 bg-${k.tone}/15`}><k.icon className={`h-5 w-5 text-${k.tone}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Set up your training program</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {setup.map((s, i) => (
            <Link key={s.title} to={s.to} className="rounded-xl border p-4 hover:border-primary hover:shadow-sm transition flex flex-col">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px]">Step {i + 1}</Badge>
              </div>
              <div className="mt-3 font-medium">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1 flex-1">{s.desc}</p>
              <div className="mt-3 text-xs text-primary inline-flex items-center">{s.cta} <ArrowRight className="h-3 w-3 ml-1" /></div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Department analytics</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              icon={BarChart3}
              title="No data yet"
              description="Once you've assigned courses and learners begin training, completion analytics will appear here by department."
              primary={{ to: "/hr/assign", label: "Assign first course", icon: ClipboardList }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              icon={Users}
              title="Nothing to report yet"
              description="Assignment events, completions and overdue alerts will show up here in real time."
              primary={{ to: "/hr/reports", label: "Open reports", icon: Users }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const setup = [
  { title: "Review course catalog", desc: "Browse compliance, leadership, and skills tracks ready to assign.", icon: BookOpen, to: "/hr/courses" as const, cta: "Browse catalog" },
  { title: "Assign your first course", desc: "Select audience (departments, teams, individuals), set mandatory and a deadline.", icon: ClipboardList, to: "/hr/assign" as const, cta: "Start assignment" },
  { title: "Invite learners", desc: "Onboard your workforce so they can access their assigned training.", icon: UserPlus, to: "/hr/reports" as const, cta: "Manage learners" },
];

function EmptyState({
  icon: Icon, title, description, primary,
}: { icon: any; title: string; description: string; primary?: { to: any; label: string; icon: any } }) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <div className="font-medium">{title}</div>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      {primary && (
        <Button asChild size="sm" className="mt-4">
          <Link to={primary.to}><primary.icon className="h-4 w-4 mr-1" />{primary.label}</Link>
        </Button>
      )}
    </div>
  );
}

function Skeleton() {
  return <div className="p-8 max-w-7xl mx-auto"><div className="h-48 rounded-2xl bg-muted animate-pulse" /></div>;
}
