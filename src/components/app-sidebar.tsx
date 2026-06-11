import { Link, useRouterState } from "@tanstack/react-router";
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

const learner = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Courses", url: "/courses", icon: BookOpen },
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const hr = [
  { title: "HR Home", url: "/hr", icon: Home },
  { title: "HR Dashboard", url: "/hr/dashboard", icon: BarChart3 },
  { title: "Courses", url: "/hr/courses", icon: BookOpen },
  { title: "Assign Courses", url: "/hr/assign", icon: ClipboardList },
  { title: "Reports", url: "/hr/reports", icon: Users },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"));

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
          <SidebarGroupLabel>Learner</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learner.map((item) => (
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
        <SidebarGroup>
          <SidebarGroupLabel>HR / Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hr.map((item) => (
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
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-xs font-semibold">
            AM
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="text-xs font-medium text-sidebar-foreground">Alex Morgan</div>
            <div className="text-[11px] text-sidebar-foreground/60">Product Team</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
