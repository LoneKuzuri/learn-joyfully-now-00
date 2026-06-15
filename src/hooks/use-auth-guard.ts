import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type Role } from "@/lib/auth";

/**
 * Guards a route by required role. Redirects to /signin if unauthenticated,
 * or to the user's own home if their role doesn't match.
 */
export function useAuthGuard(requiredRole?: Role) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/signin", replace: true });
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      navigate({ to: user.role === "hr" ? "/hr/dashboard" : "/dashboard", replace: true });
    }
  }, [ready, user, requiredRole, navigate]);

  return { user, ready, allowed: !!user && (!requiredRole || user.role === requiredRole) };
}
