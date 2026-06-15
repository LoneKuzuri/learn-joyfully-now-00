import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  BookOpen,
  Award,
  Bell,
  Users,
  BarChart3,
  ClipboardList,
  GraduationCap,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

const learner = [
  { title: "Home", url: "/" as const, icon: Home },
  { title: "Dashboard", url: "/dashboard" as const, icon: LayoutDashboard },
  { title: "My Courses", url: "/courses" as const, icon: BookOpen },
  { title: "Certificates", url: "/certificates" as const, icon: Award },
  { title: "Notifications", url: "/notifications" as const, icon: Bell },
];

const hr = [
  { title: "HR Home", url: "/hr" as const, icon: Home },
  { title: "Dashboard", url: "/hr/dashboard" as const, icon: BarChart3 },
  { title: "Courses", url: "/hr/courses" as const, icon: BookOpen },
  { title: "Assign Courses", url: "/hr/assign" as const, icon: ClipboardList },
  { title: "Reports", url: "/hr/reports" as const, icon: Users },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"));

  const items = user?.role === "hr" ? hr : learner;
  const groupLabel = user?.role === "hr" ? "HR / Admin" : "Learner";

  const handleLogout = () => {
    logout();
    navigate({ to: "/signin", replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-semibold leading-tight text-sidebar-foreground">LearnHub</div>
            <div className="text-[11px] text-sidebar-foreground/60">Enterprise LMS</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 shrink-0 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-xs font-semibold">
            {user?.initials ?? "?"}
          </div>
          <div className="group-data-[collapsible=icon]:hidden min-w-0 flex-1">
            <div className="text-xs font-medium text-sidebar-foreground truncate">{user?.name ?? "Guest"}</div>
            <div className="text-[11px] text-sidebar-foreground/60 truncate">{user?.department ?? ""}</div>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sign out">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
