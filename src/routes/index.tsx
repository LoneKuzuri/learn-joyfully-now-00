import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { isOrganizationAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BookOpen,
  Award,
  ClipboardList,
  BarChart3,
  Users,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — LearnHub" },
      { name: "description", content: "Your personalized learning workspace." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, ready, allowed } = useAuthGuard();
  if (!ready || !allowed || !user) return <PageSkeleton />;

  const isHR = isOrganizationAdmin(user.role) || user.role === "department_manager" || user.role === "trainer";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sidebar via-primary to-info text-primary-foreground p-6 sm:p-10">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-white/15 hover:bg-white/20 text-primary-foreground border-0 mb-3 gap-1">
            <Sparkles className="h-3 w-3" /> Welcome to LearnHub
          </Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
            Hello {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-2 text-primary-foreground/85 max-w-xl">
            {isHR
              ? "Get your organization training-ready. Build the catalog, assign courses to teams, and watch completion in real time."
              : "Your learning workspace is ready. Start your assigned training, build skills, and earn certificates."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <Link to={isHR ? (user.role === "department_manager" ? "/hr/reports" : user.role === "trainer" ? "/hr/courses" : "/hr/dashboard") : "/dashboard"}>
                Go to my dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link to={isHR ? (user.role === "trainer" ? "/hr/courses" : "/hr/assign") : "/courses"}>
                {isHR ? "Assign first course" : "Browse catalog"}
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute right-20 bottom-0 h-40 w-40 rounded-full bg-white/5" />
      </section>

      <div>
        <h2 className="text-lg font-semibold">Get started</h2>
        <p className="text-sm text-muted-foreground">A few steps to set up your workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(isHR ? hrSteps : learnerSteps).map((s) => (
          <Card key={s.title} className="overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px]">Step {s.step}</Badge>
              </div>
              <div>
                <div className="font-medium">{s.title}</div>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="-ml-2 text-primary">
                <Link to={s.to}>{s.cta} <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-muted/40 to-background border-dashed">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            {isHR ? <ShieldCheck className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{isHR ? "Need a guided tour?" : "New here? Watch the 2-minute intro"}</div>
            <p className="text-sm text-muted-foreground">
              {isHR
                ? "We'll walk you through assignment workflows, deadlines and reporting."
                : "See how to navigate your courses, take assessments and download certificates."}
            </p>
          </div>
          <Button variant="outline" className="gap-2 shrink-0"><PlayCircle className="h-4 w-4" /> Start tour</Button>
        </CardContent>
      </Card>
    </div>
  );
}

const learnerSteps = [
  { step: 1, title: "Open your dashboard", desc: "See assigned courses and deadlines in one place.", icon: BookOpen, to: "/dashboard" as const, cta: "Go to dashboard" },
  { step: 2, title: "Browse the catalog", desc: "Discover optional courses by category and skill.", icon: Sparkles, to: "/courses" as const, cta: "Browse courses" },
  { step: 3, title: "Earn certificates", desc: "Complete assessments to unlock verified credentials.", icon: Award, to: "/certificates" as const, cta: "View certificates" },
];

const hrSteps = [
  { step: 1, title: "Review the course catalog", desc: "Pick from compliance, leadership, and skills tracks.", icon: BookOpen, to: "/hr/courses" as const, cta: "View catalog" },
  { step: 2, title: "Assign your first course", desc: "Choose audience, deadline and mandatory status.", icon: ClipboardList, to: "/hr/assign" as const, cta: "Start assignment" },
  { step: 3, title: "Open the analytics dashboard", desc: "Track completion across teams and departments.", icon: BarChart3, to: "/hr/dashboard" as const, cta: "Open dashboard" },
  { step: 4, title: "Spot overdue learners early", desc: "Send reminders before deadlines slip.", icon: Users, to: "/hr/reports" as const, cta: "View reports" },
];

function PageSkeleton() {
  return <div className="p-8 max-w-7xl mx-auto"><div className="h-48 rounded-2xl bg-muted animate-pulse" /></div>;
}
