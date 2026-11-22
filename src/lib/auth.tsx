import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type Role =
  | "platform_super_admin"
  | "organization_admin"
  | "hr_coordinator"
  | "department_manager"
  | "trainer"
  | "learner";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  department: string;
  organizationId: string | null;
};

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
  firstTime: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  markOnboarded: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);
const ONBOARDED_KEY = "learnhub.onboarded.v2";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

async function loadProfile(userId: string): Promise<AuthUser> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,organization_id,departments(name)")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Your account profile has not been provisioned. Contact your organization administrator.");
  }

  const name = data.full_name || data.email;
  const department = Array.isArray(data.departments)
    ? (data.departments[0] as { name?: string } | undefined)?.name ?? "No department"
    : (data.departments as { name?: string } | null)?.name ?? "No department";

  return {
    id: data.id,
    name,
    email: data.email,
    role: data.role as Role,
    initials: initials(name),
    department,
    organizationId: data.organization_id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [onboardedRoles, setOnboardedRoles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }

    const supabase = getSupabase();
    let alive = true;

    const hydrate = async (userId: string | null) => {
      if (!userId) {
        if (alive) setUser(null);
        return;
      }
      try {
        const profile = await loadProfile(userId);
        if (alive) setUser(profile);
      } catch (error) {
        console.error("Unable to load Learning Hub profile:", error);
        if (alive) setUser(null);
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      void hydrate(data.session?.user.id ?? null).finally(() => {
        if (alive) setReady(true);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrate(session?.user.id ?? null).finally(() => {
        if (alive) setReady(true);
      });
    });

    try {
      const saved = localStorage.getItem(ONBOARDED_KEY);
      if (saved) setOnboardedRoles(JSON.parse(saved));
    } catch {
      setOnboardedRoles({});
    }

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    ready,
    firstTime: user ? !onboardedRoles[user.role] : false,
    configured: isSupabaseConfigured,
    login: async (email, password) => {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.");
      }
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Sign-in did not return a user.");
      const profile = await loadProfile(data.user.id);
      setUser(profile);
    },
    logout: async () => {
      if (isSupabaseConfigured) {
        const { error } = await getSupabase().auth.signOut();
        if (error) throw error;
      }
      setUser(null);
    },
    markOnboarded: () => {
      if (!user) return;
      const next = { ...onboardedRoles, [user.role]: true };
      localStorage.setItem(ONBOARDED_KEY, JSON.stringify(next));
      setOnboardedRoles(next);
    },
  }), [user, ready, onboardedRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function isOrganizationAdmin(role: Role) {
  return role === "platform_super_admin" || role === "organization_admin" || role === "hr_coordinator";
}

export function canManageCourses(role: Role) {
  return isOrganizationAdmin(role) || role === "trainer";
}
