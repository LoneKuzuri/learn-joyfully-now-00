import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, isOrganizationAdmin, type Role } from "@/lib/auth";

type RequiredRole = Role | "hr" | "admin" | "learner";

function isAllowed(role: Role, required?: RequiredRole) {
  if (!required) return true;
  if (required === "admin") return isOrganizationAdmin(role);
  if (required === "hr") return isOrganizationAdmin(role) || role === "department_manager" || role === "trainer";
  if (required === "learner") return role === "learner" || role === "trainer";
  return role === required;
}

export function homeForRole(role: Role) {
  if (role === "platform_super_admin") return "/platform/organizations";
  if (isOrganizationAdmin(role)) return "/hr/dashboard";
  if (role === "department_manager") return "/hr/reports";
  if (role === "trainer") return "/hr/courses";
  return "/dashboard";
}

export function useAuthGuard(requiredRole?: RequiredRole) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/signin", replace: true });
      return;
    }
    if (!isAllowed(user.role, requiredRole)) {
      navigate({ to: homeForRole(user.role), replace: true });
    }
  }, [ready, user, requiredRole, navigate]);

  return { user, ready, allowed: !!user && isAllowed(user.role, requiredRole) };
}
