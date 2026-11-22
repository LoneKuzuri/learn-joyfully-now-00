import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

const roleLabels = {
  platform_super_admin: "Platform Super Admin",
  organization_admin: "Organization Admin",
  hr_coordinator: "HR / Training Coordinator",
  department_manager: "Department Manager",
  trainer: "Trainer / Instructor",
  learner: "Employee / Learner",
} as const;

export function AppHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 sm:gap-3 border-b bg-card/80 px-3 sm:px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="relative flex-1 min-w-0 max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search…" className="pl-9 h-9 bg-background" /></div>
      <div className="ml-auto flex items-center gap-2">
        {user && <Badge variant="secondary" className="hidden sm:inline-flex">{roleLabels[user.role]}</Badge>}
        <Button variant="ghost" size="icon" className="relative"><Bell className="h-4 w-4" /></Button>
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">{user?.initials ?? "?"}</div>
      </div>
    </header>
  );
}
