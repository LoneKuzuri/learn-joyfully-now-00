import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, ClipboardList, Award, ArrowRight, Sparkles, PlayCircle, Search } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — LearnHub" },
      { name: "description", content: "Track your assignments, progress, and certifications." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, ready, allowed } = useAuthGuard("learner");
  const { firstTime } = useAuth();
  if (!ready || !allowed || !user) return <Skeleton />;

  const kpis = [
    { label: "Assigned", value: 0, icon: ClipboardList, color: "text-info", bg: "bg-info/10" },
    { label: "In progress", value: 0, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed", value: 0, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Certificates", value: 0, icon: Award, color: "text-warning", bg: "bg-warning/15" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Your learning starts here — let's get you set up.</p>
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
                <div className={`p-2 rounded-lg shrink-0 ${k.bg}`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty: assigned courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Continue learning</CardTitle>
          <Link to="/courses" className="text-xs text-primary hover:underline">Browse courses</Link>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BookOpen}
            title="No courses in progress yet"
            description="Once your HR admin assigns training — or you enroll from the catalog — your courses appear here."
            primary={{ to: "/courses", label: "Browse catalog", icon: Search }}
            secondary={{ to: "/courses", label: "Take a sample course", icon: PlayCircle }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Your learning path</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Complete your profile", desc: "Add your role and skills for tailored recommendations.", done: false },
              { title: "Enroll in your first course", desc: "Start with something light from the catalog.", done: false },
              { title: "Earn your first certificate", desc: "Pass an assessment to unlock a verified credential.", done: false },
            ].map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className={`mt-0.5 h-6 w-6 shrink-0 rounded-full grid place-items-center text-[11px] font-semibold ${s.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            ))}
            <Button asChild size="sm" className="mt-2">
              <Link to="/courses">Start now <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Certificates</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              icon={Award}
              title="No certificates yet"
              description="Complete a course and pass its assessment to earn a verifiable certificate you can download or share."
              primary={{ to: "/certificates", label: "How certificates work", icon: Award }}
              compact
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  primary,
  secondary,
  compact,
}: {
  icon: any;
  title: string;
  description: string;
  primary?: { to: any; label: string; icon: any };
  secondary?: { to: any; label: string; icon: any };
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-6" : "py-10"} px-4`}>
      <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <div className="font-medium">{title}</div>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      {(primary || secondary) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {primary && (
            <Button asChild size="sm">
              <Link to={primary.to}><primary.icon className="h-4 w-4 mr-1" />{primary.label}</Link>
            </Button>
          )}
          {secondary && (
            <Button asChild size="sm" variant="outline">
              <Link to={secondary.to}><secondary.icon className="h-4 w-4 mr-1" />{secondary.label}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return <div className="p-8 max-w-7xl mx-auto"><div className="h-48 rounded-2xl bg-muted animate-pulse" /></div>;
}
