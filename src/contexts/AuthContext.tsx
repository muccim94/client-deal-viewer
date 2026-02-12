import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "user";

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    if (data) {
      setRole(data.role as AppRole);
    }
  };

  const tryPromoteFirstAdmin = async () => {
    try {
      const { data } = await supabase.functions.invoke("promote-first-admin");
      if (data?.promoted) {
        setRole("admin");
      }
    } catch {
      // ignore - not critical
    }
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        if (session?.user) {
          setUser(session.user);
          setLoading(false);
          // Load role and try admin promotion in background
          setTimeout(async () => {
            await loadRole(session.user.id);
            await tryPromoteFirstAdmin();
            await loadRole(session.user.id);
          }, 0);
        } else {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Validate the session is still valid server-side
        const { data: { user: validUser }, error } = await supabase.auth.getUser();
        if (error || !validUser) {
          // Session is stale/expired — sign out cleanly
          await supabase.auth.signOut();
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }
        setUser(validUser);
        await loadRole(validUser.id);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
