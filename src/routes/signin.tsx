import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, type Role } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, ShieldCheck, Sparkles, Users, BookOpen, Award } from "lucide-react";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — LearnHub" },
      { name: "description", content: "Sign in to LearnHub to access your training, courses and certificates." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { user, login, ready } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("learner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password, role);
    setLoading(false);
    navigate({ to: "/", replace: true });
  };

  const fillDemo = () => {
    setEmail(role === "hr" ? "priya@learnhub.demo" : "alex@learnhub.demo");
    setPassword("demo1234");
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 text-primary-foreground overflow-hidden bg-gradient-to-br from-sidebar via-primary to-info">
        <div className="relative z-10 flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-white/15 grid place-items-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="font-semibold">LearnHub</div>
        </div>
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Enterprise Learning Platform
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            One platform for learning, certification & compliance.
          </h1>
          <p className="text-primary-foreground/85">
            Deliver mandatory training, track completions, and certify your workforce — all from a single workspace.
          </p>
          <ul className="space-y-2 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Curated course catalog & SCORM player</li>
            <li className="flex items-center gap-2"><Users className="h-4 w-4" /> Assign by team, department or individual</li>
            <li className="flex items-center gap-2"><Award className="h-4 w-4" /> Auto-generated, verifiable certificates</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-primary-foreground/70">
          © 2026 LearnHub. Inspired by Docebo.
        </div>
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-white/5" />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="font-semibold">LearnHub</div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to continue to your workspace.</p>
          </div>

          <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="learner" className="gap-2">
                <BookOpen className="h-4 w-4" /> Learner
              </TabsTrigger>
              <TabsTrigger value="hr" className="gap-2">
                <ShieldCheck className="h-4 w-4" /> HR Admin
              </TabsTrigger>
            </TabsList>
            <TabsContent value="learner" className="mt-4">
              <p className="text-xs text-muted-foreground">
                Access your assigned training, track progress and download certificates.
              </p>
            </TabsContent>
            <TabsContent value="hr" className="mt-4">
              <p className="text-xs text-muted-foreground">
                Assign courses, manage deadlines, and monitor organization-wide compliance.
              </p>
            </TabsContent>
          </Tabs>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input id="email" type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" className="text-xs text-primary hover:underline">Forgot?</button>
                  </div>
                  <Input id="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : `Sign in as ${role === "hr" ? "HR Admin" : "Learner"}`}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={fillDemo}>
                  Use demo credentials
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            By signing in you agree to LearnHub's <Link to="/signin" className="underline">Terms</Link> and{" "}
            <Link to="/signin" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
