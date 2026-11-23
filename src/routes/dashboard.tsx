import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Award,
  ArrowRight,
  Sparkles,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — Learning Hub Connect" }] }),
  component: DashboardPage,
});
type Enrollment = {
  id: string;
  status: string;
  progress_percent: number;
  due_at: string | null;
  courses: { id: string; title: string; category: string } | null;
};
function DashboardPage() {
  const { user, ready, allowed } = useAuthGuard("learner");
  const { firstTime } = useAuth();
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    const load = async () => {
      const supabase = getSupabase();
      const [enrollments, certs] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id,status,progress_percent,due_at,courses(id,title,category)")
          .order("due_at", { ascending: true }),
        supabase.from("certificates").select("id", { count: "exact", head: true }),
      ]);
      if (enrollments.error) toast.error(enrollments.error.message);
      else if (alive) setRows((enrollments.data ?? []) as unknown as Enrollment[]);
      if (certs.error) toast.error(certs.error.message);
      else if (alive) setCertCount(certs.count ?? 0);
      if (alive) setLoading(false);
    };
    void load();
    return () => {
      alive = false;
    };
  }, [allowed]);
  if (!ready || !allowed || !user)
    return (
      <div className="p-8">
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  const completed = rows.filter((r) => r.progress_percent === 100).length;
  const inProgress = rows.filter((r) => r.progress_percent > 0 && r.progress_percent < 100).length;
  const stats = [
    { label: "Assigned", value: rows.length, icon: ClipboardList },
    { label: "In progress", value: inProgress, icon: BookOpen },
    { label: "Completed", value: completed, icon: CheckCircle2 },
    { label: "Certificates", value: certCount, icon: Award },
  ];
  const active = rows.filter((r) => r.progress_percent < 100).slice(0, 4);
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your assigned learning and progress at a glance.
          </p>
        </div>
        {firstTime && (
          <Badge>
            <Sparkles className="h-3 w-3 mr-1" />
            First login
          </Badge>
        )}
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-semibold mt-2">{loading ? "—" : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Continue learning</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/courses">
              All courses
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your assignments…</p>
          ) : active.length === 0 ? (
            <div className="py-8 text-center">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <div className="font-medium">You’re all caught up</div>
              <p className="text-sm text-muted-foreground mt-1">
                New assigned courses will appear here.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/courses">
                  <Search className="h-4 w-4 mr-1" />
                  View courses
                </Link>
              </Button>
            </div>
          ) : (
            active.map((row) => (
              <div key={row.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{row.courses?.title ?? "Course"}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.courses?.category ?? "Learning"}
                      {row.due_at ? " · Due " + new Date(row.due_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/courses/$courseId" params={{ courseId: row.courses?.id ?? "" }}>
                      Continue
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={row.progress_percent} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">{row.progress_percent}%</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="font-medium">Your certificates</div>
            <p className="text-sm text-muted-foreground mt-1">
              View and print your completed training credentials.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/certificates">View certificates</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="font-medium">Learning progress</div>
            <p className="text-sm text-muted-foreground mt-1">
              {rows.length
                ? Math.round(rows.reduce((sum, r) => sum + r.progress_percent, 0) / rows.length)
                : 0}
              % average progress across your assignments.
            </p>
            <Progress
              value={
                rows.length ? rows.reduce((sum, r) => sum + r.progress_percent, 0) / rows.length : 0
              }
              className="mt-4 h-2"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
