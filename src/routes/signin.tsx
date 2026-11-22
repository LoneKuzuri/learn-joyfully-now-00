import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { homeForRole } from "@/hooks/use-auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ShieldCheck, Sparkles, Users, BookOpen, Award, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/signin")({
  head: () => ({ meta: [{ title: "Sign in — Learning Hub Connect" }] }),
  component: SignInPage,
});

function SignInPage() {
  const { user, login, ready, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (ready && user) {
    void navigate({ to: homeForRole(user.role) as never, replace: true });
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      const nextUser = await import("@/lib/auth");
      void nextUser;
      navigate({ to: "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-10 text-primary-foreground overflow-hidden bg-gradient-to-br from-sidebar via-primary to-info">
        <div className="relative z-10 flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-white/15 grid place-items-center"><GraduationCap className="h-5 w-5" /></div>
          <div className="font-semibold">Learning Hub Connect</div>
        </div>
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs"><Sparkles className="h-3.5 w-3.5" /> Enterprise Learning Platform</div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">One platform for learning, certification and compliance.</h1>
          <p className="text-primary-foreground/85">Deliver training, support your people and understand workforce capability from one connected workspace.</p>
          <ul className="space-y-2 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Structured learning paths and course delivery</li>
            <li className="flex items-center gap-2"><Users className="h-4 w-4" /> Six role types with organization-level access</li>
            <li className="flex items-center gap-2"><Award className="h-4 w-4" /> Progress tracking and verifiable credentials</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-primary-foreground/70">Learning Hub Connect</div>
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-white/5" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2"><GraduationCap className="h-8 w-8 text-primary" /><span className="font-semibold">Learning Hub Connect</span></div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in with the account provided by your organization.</p>
          </div>
          {!configured && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium"><AlertCircle className="h-4 w-4" /> Backend setup required</div>
              <p className="mt-1 text-muted-foreground">Connect a Supabase project and configure the environment variables before signing in.</p>
            </div>
          )}
          {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="email">Work email</Label><Input id="email" type="email" autoComplete="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading || !configured}>{loading ? "Signing in…" : "Sign in"}</Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-xs text-center text-muted-foreground">Need access? Contact your organization administrator. <Link to="/" className="underline">Return home</Link></p>
        </div>
      </div>
    </div>
  );
}
