import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FALLBACK_BASES, PRIMARY_BASE } from "@/lib/backendEndpoints";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isEditor: boolean;
  isSurgeon: boolean;
  isParent: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, redirectPath?: string) => Promise<{ error: Error | null }>;
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

const PASSWORD_GRANT_PATH = "/auth/v1/token?grant_type=password";

class AuthRequestError extends Error {
  status?: number;
  isNetworkError: boolean;

  constructor(message: string, opts: { status?: number; isNetworkError?: boolean } = {}) {
    super(message);
    this.name = "AuthRequestError";
    this.status = opts.status;
    this.isNetworkError = !!opts.isNetworkError;
  }
}

type PasswordGrantPayload = {
  access_token?: string;
  refresh_token?: string;
  msg?: string;
  message?: string;
  error?: string;
  error_description?: string;
};

const getPrimaryAuthUrl = () => {
  if (!PRIMARY_BASE) return null;
  return `${PRIMARY_BASE}${PASSWORD_GRANT_PATH}`;
};

const getAuthUrls = () => {
  const urls = [
    getPrimaryAuthUrl(),
    ...FALLBACK_BASES.map((base) => `${base}${PASSWORD_GRANT_PATH}`),
  ].filter((url): url is string => !!url);
  return Array.from(new Set(urls));
};

const getAuthHeaders = () => {
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!publishableKey) return null;
  return {
    apikey: publishableKey,
    "Content-Type": "application/json",
  };
};

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
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .abortSignal(timeout.signal);
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
    } catch (error) {
      console.error(`Error loading roles (attempt ${i + 1}):`, error);
    } finally {
      timeout.clear();
    }
  }
  return null;
};

const requestPasswordGrant = async (
  authUrl: string,
  headers: Record<string, string>,
  email: string,
  password: string,
  signal: AbortSignal,
): Promise<PasswordGrantPayload> => {
  try {
    const response = await fetch(authUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
      signal,
      credentials: "omit",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as PasswordGrantPayload | null;
    if (!response.ok) {
      const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || "Ошибка входа";
      throw new AuthRequestError(message, { status: response.status });
    }
    return payload ?? {};
  } catch (error) {
    if (error instanceof AuthRequestError) throw error;
    const isAbort = error instanceof Error && error.name === "AbortError";
    throw new AuthRequestError(isAbort ? "Таймаут авторизации" : "Network error", { isNetworkError: true });
  }
};

const runAuthRace = async (
  authUrls: string[],
  headers: Record<string, string>,
  email: string,
  password: string,
  timeoutMs: number,
): Promise<PasswordGrantPayload> => {
  const controllers = authUrls.map(() => new AbortController());
  const timer = window.setTimeout(() => controllers.forEach((controller) => controller.abort()), timeoutMs);

  return new Promise((resolve, reject) => {
    let settled = false;
    let finished = 0;
    let lastNetworkError: AuthRequestError | null = null;

    const finishWithErrorIfDone = () => {
      if (settled || finished < authUrls.length) return;
      settled = true;
      window.clearTimeout(timer);
      reject(lastNetworkError ?? new AuthRequestError("Не удалось подключиться к серверу авторизации", { isNetworkError: true }));
    };

    authUrls.forEach((url, index) => {
      requestPasswordGrant(url, headers, email, password, controllers[index].signal)
        .then((payload) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          controllers.forEach((controller, controllerIndex) => {
            if (controllerIndex !== index) controller.abort();
          });
          resolve(payload);
        })
        .catch((error) => {
          if (settled) return;
          const authError = error instanceof AuthRequestError
            ? error
            : new AuthRequestError("Network error", { isNetworkError: true });

          if (!authError.isNetworkError) {
            settled = true;
            window.clearTimeout(timer);
            controllers.forEach((controller, controllerIndex) => {
              if (controllerIndex !== index) controller.abort();
            });
            reject(authError);
            return;
          }

          lastNetworkError = authError;
          finished += 1;
          finishWithErrorIfDone();
        });
    });
  });
};

const signInWithTimeout = async (email: string, password: string): Promise<{ error: Error | null }> => {
  const authUrls = getAuthUrls();
  const headers = getAuthHeaders();
  if (!authUrls.length || !headers) {
    return { error: new Error("Ошибка настройки авторизации") };
  }

  let lastError: Error | null = null;
  for (const delay of [0, 700]) {
    if (delay) await sleep(delay);
    try {
      const payload = await runAuthRace(authUrls, headers, email, password, 6500);
      if (!payload?.access_token || !payload?.refresh_token) {
        return { error: new Error("Сервер авторизации вернул неполный ответ") };
      }
      const { error } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Network error");
      if (!(lastError instanceof AuthRequestError) || !lastError.isNetworkError) {
        return { error: lastError };
      }
      if (delay === 0) {
        continue;
      }
    }
  }

  const message = lastError instanceof AuthRequestError && lastError.isNetworkError
    ? "Сервер авторизации не отвечает. Попробуйте ещё раз или обновите страницу."
    : "Не удалось подключиться к серверу авторизации. Попробуйте ещё раз.";
  return { error: new Error(message) };
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
    return signInWithTimeout(email, password);
  };

  const signUp = async (email: string, password: string, redirectPath?: string) => {
    const safePath =
      redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//")
        ? redirectPath
        : "/";
    const redirectUrl = `${window.location.origin}${safePath}`;
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

/** Безопасный доступ к авторизации вне провайдера (тесты, изолированный рендер). */
export function useOptionalAuth(): AuthContextType | undefined {
  return useContext(AuthContext);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
