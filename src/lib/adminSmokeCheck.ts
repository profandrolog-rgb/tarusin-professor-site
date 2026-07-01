import { supabase } from "@/integrations/supabase/client";

/**
 * Каждая проверка — быстрый запрос к таблице, которую использует раздел админки.
 * head:true + count:'exact' возвращает только заголовки, без выборки строк, поэтому
 * запрос дёшев, но валидирует доступ (RLS + GRANT) и живость БД.
 */
type Probe = {
  route: string;
  label: string;
  run: () => Promise<void>;
};

const probes: Probe[] = [
  {
    route: "/admin",
    label: "Административная панель",
    run: async () => {
      const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    },
  },
  {
    route: "/admin/patients",
    label: "Пациенты",
    run: async () => {
      const { error } = await supabase.from("patients").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    },
  },
  {
    route: "/admin/repertory",
    label: "Реперторий",
    run: async () => {
      const { error } = await supabase.from("repertory_rubrics").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    },
  },
  {
    route: "/admin/article-orchestrator",
    label: "Оркестратор статей",
    run: async () => {
      const { error } = await supabase.from("disease_articles").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    },
  },
  {
    route: "/admin/system-settings",
    label: "Настройки системы",
    run: async () => {
      const { error } = await supabase.functions.invoke("timeweb-deploy-status", { method: "GET" });
      if (error) throw error;
    },
  },
  {
    route: "/cabinet",
    label: "Кабинет",
    run: async () => {
      const { error } = await supabase.from("patient_chat_messages").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    },
  },
  {
    route: "/cabinet/vault",
    label: "Vault",
    run: async () => {
      const { error } = await supabase.from("vault_notes").select("id", { count: "exact", head: true }).limit(1);
      if (error) throw error;
    },
  },
];

export type SmokeResult = {
  route: string;
  label: string;
  status: "ok" | "error";
  latency_ms: number;
  error?: string;
};

export async function runAdminSmokeCheck(opts: {
  deployId?: string | null;
  deployStatus?: string | null;
  userId?: string | null;
}): Promise<SmokeResult[]> {
  const results: SmokeResult[] = [];

  for (const p of probes) {
    const t0 = performance.now();
    let status: "ok" | "error" = "ok";
    let err: string | undefined;
    try {
      await p.run();
    } catch (e: any) {
      status = "error";
      err = e?.message || String(e);
    }
    const latency_ms = Math.round(performance.now() - t0);
    results.push({ route: p.route, label: p.label, status, latency_ms, error: err });
  }

  // Пишем в журнал одним батчем
  try {
    await supabase.from("admin_smoke_checks").insert(
      results.map((r) => ({
        deploy_id: opts.deployId ?? null,
        deploy_status: opts.deployStatus ?? null,
        route: r.route,
        label: r.label,
        status: r.status,
        latency_ms: r.latency_ms,
        error: r.error ?? null,
        triggered_by: opts.userId ?? null,
      })),
    );
  } catch (e) {
    console.error("smoke check log write failed", e);
  }

  return results;
}

export async function fetchLatestSmokeChecks(limit = 20): Promise<{
  deploy_id: string | null;
  created_at: string;
  results: Array<{
    route: string;
    label: string;
    status: string;
    latency_ms: number | null;
    error: string | null;
  }>;
}[]> {
  const { data, error } = await supabase
    .from("admin_smoke_checks")
    .select("deploy_id, created_at, route, label, status, latency_ms, error")
    .order("created_at", { ascending: false })
    .limit(limit * 10);
  if (error) throw error;
  // Группируем по (deploy_id, минута created_at) как один прогон
  const groups = new Map<string, any>();
  for (const row of data || []) {
    const key = `${row.deploy_id || "manual"}|${(row.created_at || "").slice(0, 19)}`;
    if (!groups.has(key)) {
      groups.set(key, { deploy_id: row.deploy_id, created_at: row.created_at, results: [] });
    }
    groups.get(key).results.push({
      route: row.route,
      label: row.label,
      status: row.status,
      latency_ms: row.latency_ms,
      error: row.error,
    });
  }
  return Array.from(groups.values()).slice(0, limit);
}
