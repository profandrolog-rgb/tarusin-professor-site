import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isEditor: boolean;
  isSurgeon: boolean;
  isParent: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

type Roles = { admin: boolean; editor: boolean; surgeon: boolean; parent: boolean };

const EMPTY_ROLES: Roles = { admin: false, editor: false, surgeon: false, parent: false };
const CACHE_PREFIX = "auth_roles_v1:";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readCache = (userId: string): Roles | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      admin: !!parsed.admin,
      editor: !!parsed.editor,
      surgeon: !!parsed.surgeon,
      parent: !!parsed.parent,
    };
  } catch {
    return null;
  }
};

const writeCache = (userId: string, roles: Roles) => {
  try {
    sessionStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(roles));
  } catch {}
};

const clearCache = (userId?: string) => {
  try {
    if (userId) {
      sessionStorage.removeItem(CACHE_PREFIX + userId);
    } else {
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(key);
      }
    }
  } catch {}
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const withTimeout = (ms: number) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => window.clearTimeout(timer) };
};

/**
 * Один запрос всех ролей пользователя из user_roles.
 * Возвращает null при сетевой ошибке (после ретраев), Roles при успехе (пустой массив = все false).
 */
const fetchRolesWithRetry = async (userId: string): Promise<Roles | null> => {
  const delays = [0, 500, 1000, 2000];
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) await sleep(delays[i]);
    const timeout = withTimeout(8000);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .abortSignal(timeout.signal);
    timeout.clear();
    if (!error) {
      const set = new Set((data ?? []).map((r: any) => r.role));
      return {
        admin: set.has("admin"),
        editor: set.has("editor"),
        surgeon: set.has("surgeon"),
        parent: set.has("parent"),
      };
    }
    console.error(`Error loading roles (attempt ${i + 1}):`, error);
  }
  return null;
};

const rolesEqual = (a: Roles, b: Roles) =>
  a.admin === b.admin && a.editor === b.editor && a.surgeon === b.surgeon && a.parent === b.parent;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Roles>(EMPTY_ROLES);
  const [loading, setLoading] = useState(true);
  const inflightRef = useRef<string | null>(null);
  const rolesRef = useRef<Roles>(EMPTY_ROLES);
  const lastUserIdRef = useRef<string | null | undefined>(undefined);

  const applyRoles = (next: Roles) => {
    if (!rolesEqual(rolesRef.current, next)) {
      rolesRef.current = next;
      setRoles(next);
    }
  };

  const refreshRoles = async (userId: string, opts: { hasCache: boolean }) => {
    if (inflightRef.current === userId) return;
    inflightRef.current = userId;
    try {
      const result = await fetchRolesWithRetry(userId);
      if (result) {
        applyRoles(result);
        writeCache(userId, result);
      } else if (!opts.hasCache) {
        toast.error("Не удалось проверить права доступа, попробуйте обновить страницу");
      }
    } finally {
      inflightRef.current = null;
    }
  };

  const handleSession = (nextSession: Session | null) => {
    const nextUserId = nextSession?.user?.id ?? null;
    // Дедуп: одинаковая сессия — не гоняем повторный fetch ролей.
    const isSameUser = lastUserIdRef.current === nextUserId;
    lastUserIdRef.current = nextUserId;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      const userId = nextSession.user.id;
      if (isSameUser && !loading) return;
      const cached = readCache(userId);
      if (cached) {
        applyRoles(cached);
        setLoading(false);
        refreshRoles(userId, { hasCache: true });
      } else {
        refreshRoles(userId, { hasCache: false }).finally(() => setLoading(false));
      }
    } else {
      applyRoles(EMPTY_ROLES);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Полагаемся только на onAuthStateChange (включая INITIAL_SESSION),
    // чтобы избежать двойной загрузки ролей при монтировании.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT") clearCache();
      handleSession(nextSession);
    });

    const fallback = window.setTimeout(() => {
      if (lastUserIdRef.current !== undefined) return;
      supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    }, 1200);

    return () => {
      window.clearTimeout(fallback);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error };
  };

  const signOut = async () => {
    clearCache();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin: roles.admin,
        isEditor: roles.editor,
        isSurgeon: roles.surgeon,
        isParent: roles.parent,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
