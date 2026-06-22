// Repertorize from free-form complaint text.
// Two-step protocol:
//   mode="extract" → Claude extracts statements + Voyage embeds + DB similarity search → candidates list
//   mode="select"  → Claude picks final rubrics from a doctor-curated candidate list → reasons
//
// Admin-only.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const PRIMARY_MODEL = "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-sonnet-4-5-20250929";
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-4-lite";

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function callAnthropic(apiKey: string, systemPrompt: string, userPrompt: string) {
  const tryOnce = async (m: string) => fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: m, max_tokens: 4000, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });

  let resp = await tryOnce(PRIMARY_MODEL);
  if (!resp.ok && resp.status === 404) resp = await tryOnce(FALLBACK_MODEL);
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Anthropic ${resp.status}: ${t.slice(0, 500)}`);
  }
  const j = await resp.json();
  return (j?.content?.[0]?.text || "") as string;
}

function parseJsonLoose<T>(text: string): T {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  // try array first
  const a = t.indexOf("[");
  const o = t.indexOf("{");
  let start = a;
  if (o >= 0 && (a < 0 || o < a)) start = o;
  const endChar = start === a ? "]" : "}";
  const end = t.lastIndexOf(endChar);
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t) as T;
}

async function voyageEmbed(apiKey: string, inputs: string[], inputType: "document" | "query"): Promise<number[][]> {
  const resp = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: inputs, input_type: inputType }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Voyage ${resp.status}: ${t.slice(0, 500)}`);
  }
  const j = await resp.json();
  const data: { index: number; embedding: number[] }[] = j?.data || [];
  return data.sort((a, b) => a.index - b.index).map((x) => x.embedding);
}

async function requireAdmin(authHeader: string | null) {
  if (!authHeader) throw new Error("Unauthorized");
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = admin();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const isAdmin = (roles || []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden");
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    await requireAdmin(req.headers.get("Authorization"));

    const anthroKey = Deno.env.get("ANTHROPIC_API_KEY");
    const voyageKey = Deno.env.get("VOYAGE_API_KEY");
    if (!anthroKey) throw new Error("ANTHROPIC_API_KEY not configured");
    if (!voyageKey) throw new Error("VOYAGE_API_KEY not configured");

    const body = await req.json();
    const mode: string = body.mode || "extract";
    const supabase = admin();

    if (mode === "extract") {
      const complaint: string = (body.complaint || "").trim();
      if (!complaint || complaint.length > 8000) {
        return new Response(JSON.stringify({ error: "Текст жалоб обязателен (до 8000 символов)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1) Claude → list of clinically-meaningful statements (RU)
      const sys = [
        "Ты — врач-гомеопат, эксперт по репертuризации Кента и Бённингхаузена.",
        "Получаешь жалобы пациента (свободный текст на русском). Раздели их на отдельные клинически значимые утверждения для репертuризации.",
        "",
        "ПРАВИЛА:",
        "1. Каждое утверждение конкретное: локализация + ощущение + модальность/время/что улучшает/ухудшает.",
        "2. НЕ дроби «болит голова» на одну строку — добавь характер (пульсирующая, давящая) и модальность (хуже утром, от тепла).",
        "3. Игнорируй паспортные данные, имена, возраст — только симптоматика.",
        "4. Выделяй strange / rare / peculiar симптомы отдельной строкой.",
        "5. Психические/общие симптомы — отдельно от локальных.",
        "",
        "ФОРМАТ: строго JSON-массив строк на русском. Без markdown. От 3 до 20 утверждений.",
      ].join("\n");
      const raw = await callAnthropic(anthroKey, sys, `Жалобы:\n${complaint}\n\nВерни JSON-массив утверждений.`);
      let statements: string[] = [];
      try {
        statements = parseJsonLoose<string[]>(raw).filter((s) => typeof s === "string" && s.trim().length > 0);
      } catch {
        throw new Error("Не удалось разобрать ответ Claude (extract)");
      }
      if (statements.length === 0) throw new Error("Claude не выделил ни одного утверждения");

      // 2) Voyage embeddings for all statements (query type)
      const vectors = await voyageEmbed(voyageKey, statements, "query");

      // 3) Similarity search per statement — run in parallel to avoid serial latency
      const candidatesMap = new Map<string, {
        rubric_id: string; name: string; name_ru: string | null; chapter_id: string | null;
        similarity: number; matched_statements: string[];
      }>();
      const searchResults = await Promise.all(
        statements.map((_, i) =>
          supabase.rpc("search_rubrics_by_embedding", {
            _query: vectors[i] as unknown as string,
            _limit: 8,
          }).then((r) => ({ i, data: r.data, error: r.error })),
        ),
      );
      for (const { i, data, error } of searchResults) {
        if (error) {
          console.log(`[repertorize] search error for stmt ${i}:`, error.message);
          continue;
        }
        for (const row of (data || []) as any[]) {
          const existing = candidatesMap.get(row.rubric_id);
          if (!existing) {
            candidatesMap.set(row.rubric_id, {
              rubric_id: row.rubric_id,
              name: row.name,
              name_ru: row.name_ru,
              chapter_id: row.chapter_id,
              similarity: row.similarity,
              matched_statements: [statements[i]],
            });
          } else {
            existing.similarity = Math.max(existing.similarity, row.similarity);
            if (!existing.matched_statements.includes(statements[i])) {
              existing.matched_statements.push(statements[i]);
            }
          }
        }
      }

      const candidates = Array.from(candidatesMap.values())
        .sort((a, b) => b.matched_statements.length - a.matched_statements.length || b.similarity - a.similarity)
        .slice(0, 60);

      return new Response(JSON.stringify({ ok: true, statements, candidates }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "select") {
      const complaint: string = (body.complaint || "").trim();
      const candidates: { rubric_id: string; name_ru: string | null; name: string }[] = Array.isArray(body.candidates) ? body.candidates : [];
      if (!complaint) throw new Error("complaint required");
      if (!candidates.length) throw new Error("candidates required");

      const allowedIds = new Set(candidates.map((c) => c.rubric_id));
      const listForPrompt = candidates.map((c) => `- [${c.rubric_id}] ${c.name_ru || c.name}`).join("\n");

      const sys = [
        "Ты — врач-гомеопат, эксперт по репертuризации. Получаешь жалобы пациента и список рубрик-кандидатов.",
        "Задача: выбрать ТОЛЬКО те рубрики, которые действительно характерны для случая (не похожи по словам, а клинически уместны).",
        "",
        "ПРАВИЛА:",
        "1. Используй rubric_id ТОЛЬКО из переданного списка. Не выдумывай новые id.",
        "2. Для каждой выбранной рубрики дай краткое (1-2 предложения) объяснение, почему она характерна.",
        "3. Если кандидат не подходит — не включай его. Лучше меньше, но точно.",
        "4. Цель — 6-15 итоговых рубрик для подсчёта (грейд × вес).",
        "",
        "ФОРМАТ: строго JSON-массив объектов {\"rubric_id\":\"...\",\"reason\":\"...\"}. Без markdown.",
      ].join("\n");
      const user = `Жалобы пациента:\n${complaint}\n\nКандидаты (rubric_id и текст):\n${listForPrompt}\n\nВерни JSON-массив выбранных.`;
      const raw = await callAnthropic(anthroKey, sys, user);
      let selected: { rubric_id: string; reason: string }[] = [];
      try {
        selected = parseJsonLoose<typeof selected>(raw).filter((s) =>
          s && typeof s.rubric_id === "string" && typeof s.reason === "string" && allowedIds.has(s.rubric_id)
        );
      } catch {
        throw new Error("Не удалось разобрать ответ Claude (select)");
      }

      return new Response(JSON.stringify({ ok: true, selected }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
