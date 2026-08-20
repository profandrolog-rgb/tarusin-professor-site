// Самопроверка готовности системы «в один клик»: вход, база, хранилище,
// Edge Function парсинга и ИИ-шлюз. Возвращает понятные причины отказа.

import { supabase } from "@/integrations/supabase/client";
import { PRIMARY_BASE } from "@/lib/backendEndpoints";

const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export interface ReadinessCheck {
  name: string;
  ok: boolean;
  detail?: string;
  ms?: number;
}

export interface ReadinessReport {
  ok: boolean;
  checks: ReadinessCheck[];
  finishedAt: string;
}

const timed = async (
  name: string,
  fn: () => Promise<string | void>,
): Promise<ReadinessCheck> => {
  const t = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, detail: detail || undefined, ms: Date.now() - t };
  } catch (e) {
    return { name, ok: false, detail: (e as Error).message, ms: Date.now() - t };
  }
};

export async function runSystemReadinessCheck(): Promise<ReadinessReport> {
  const checks: ReadinessCheck[] = [];

  checks.push(
    await timed("Канал связи с сервером (прокси)", async () => {
      const base = PRIMARY_BASE || "";
      if (!base) throw new Error("Адрес бэкенда не настроен (VITE_SUPABASE_PROXY_URL)");
      if (!SUPABASE_PUBLISHABLE_KEY) throw new Error("Не настроен ключ доступа к бэкенду");
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      try {
        const resp = await fetch(`${base}/auth/v1/health`, {
          headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
          signal: ctrl.signal,
        });
        if (!resp.ok) throw new Error(`Ответ ${resp.status}`);
        return new URL(base).host;
      } catch (e) {
        const msg = (e as Error).name === "AbortError" ? "нет ответа за 8 с" : (e as Error).message;
        throw new Error(`${new URL(base).host}: ${msg}`);
      } finally {
        clearTimeout(to);
      }
    }),
  );

  let accessToken: string | null = null;
  checks.push(
    await timed("Вход в систему (сессия)", async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error(error.message);
      let session = data.session;
      const expiresSoon = !session?.expires_at || session.expires_at * 1000 < Date.now() + 60_000;
      if (expiresSoon) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw new Error(`Не удалось обновить сессию: ${refreshError.message}`);
        session = refreshed.session;
      }
      if (!session?.access_token) throw new Error("Вы не авторизованы — войдите заново");
      accessToken = session.access_token;
      const exp = session.expires_at ? new Date(session.expires_at * 1000) : null;
      return exp ? `действует до ${exp.toLocaleTimeString("ru-RU")}` : undefined;
    }),
  );

  checks.push(
    await timed("Чтение базы данных (визиты)", async () => {
      const { error, count } = await supabase
        .from("patient_visits")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return typeof count === "number" ? `${count} записей` : undefined;
    }),
  );

  checks.push(
    await timed("Запись файлов в хранилище", async () => {
      const path = `protocol-import/_healthcheck-${Date.now()}.txt`;
      const { error } = await supabase.storage
        .from("patient-lab-docs")
        .upload(path, new Blob(["ok"], { type: "text/plain" }), { upsert: true });
      if (error) throw new Error(error.message);
      await supabase.storage.from("patient-lab-docs").remove([path]);
    }),
  );

  if (accessToken) {
    const t = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("parse-visit-protocol", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { ping: true },
      });
      if (error) throw new Error(error.message);
      const inner = (data as { checks?: ReadinessCheck[] } | null)?.checks;
      if (Array.isArray(inner) && inner.length) {
        checks.push({
          name: "Функция распознавания протоколов",
          ok: true,
          ms: Date.now() - t,
        });
        checks.push(...inner);
      } else {
        checks.push({ name: "Функция распознавания протоколов", ok: true, ms: Date.now() - t });
      }
    } catch (e) {
      checks.push({
        name: "Функция распознавания протоколов",
        ok: false,
        detail: (e as Error).message,
        ms: Date.now() - t,
      });
    }
  } else {
    checks.push({
      name: "Функция распознавания протоколов",
      ok: false,
      detail: "Проверка невозможна без активного входа",
    });
  }

  return {
    ok: checks.every((c) => c.ok),
    checks,
    finishedAt: new Date().toLocaleTimeString("ru-RU"),
  };
}
