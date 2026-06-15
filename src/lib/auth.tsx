import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "learner" | "hr";

export type AuthUser = {
  name: string;
  email: string;
  role: Role;
  initials: string;
  department: string;
};

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
  firstTime: boolean;
  login: (email: string, password: string, role: Role) => Promise<AuthUser>;
  logout: () => void;
  markOnboarded: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_KEY = "learnhub.auth.v1";
const ONBOARDED_KEY = "learnhub.onboarded.v1";

const DEMO_USERS: Record<Role, AuthUser> = {
  learner: { name: "Alex Morgan", email: "alex@learnhub.demo", role: "learner", initials: "AM", department: "Product Team" },
  hr: { name: "Priya Shah", email: "priya@learnhub.demo", role: "hr", initials: "PS", department: "People & HR" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [onboardedRoles, setOnboardedRoles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
      const ob = localStorage.getItem(ONBOARDED_KEY);
      if (ob) setOnboardedRoles(JSON.parse(ob));
    } catch {}
    setReady(true);
  }, []);

  const value = useMemo<AuthState>(() => {
    const firstTime = user ? !onboardedRoles[user.role] : false;
    return {
      user,
      ready,
      firstTime,
      login: async (email, _password, role) => {
        const u: AuthUser = { ...DEMO_USERS[role], email: email || DEMO_USERS[role].email };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setUser(u);
        return u;
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
      markOnboarded: () => {
        if (!user) return;
        const next = { ...onboardedRoles, [user.role]: true };
        localStorage.setItem(ONBOARDED_KEY, JSON.stringify(next));
        setOnboardedRoles(next);
      },
    };
  }, [user, ready, onboardedRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
