// Agentic ReAct loop using Lovable AI Gateway (OpenAI-compatible) with tool-calling.
// Streams Server-Sent Events: step | tool_call | tool_result | awaiting_approval | final | error
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MAX_STEPS = 12;

const SYSTEM_PROMPT = `Ты — клинический ИИ-агент профессора Тарусина (детский уролог-андролог, гомеопат).
Работаешь автономно: разбиваешь задачу на шаги, вызываешь инструменты, анализируешь результаты, делаешь выводы.

Правила:
- Думай по-русски, отвечай по-русски, цитаты из англоязычных источников переводи.
- Перед действиями, меняющими данные (draft_assignment, draft_prescription) — ВСЕГДА получай подтверждение через approval-механизм (сервер сам остановит и спросит у врача).
- Используй инструменты по делу: не зови web_search, если ответ есть в treatment_catalog.
- В финальном ответе: чёткая структура (Анализ → Обоснование → Назначения → Источники).
- Указывай номера шагов с цитатами при ссылке на найденную информацию.
- Если не хватает данных — задай уточняющий вопрос и заверши без вызова инструментов.`;

// ============ TOOLS DEFINITION ============
const TOOLS = [
  {
    type: "function",
    function: {
      name: "perplexity_search",
      description: "Поиск актуальной информации в интернете через Perplexity Sonar с цитатами. Используй для свежих исследований, клинических рекомендаций, новостей.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Поисковый запрос (можно по-русски)" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pubmed_search",
      description: "Поиск научных статей в PubMed. Возвращает заголовок, авторов, журнал, год, аннотацию.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Запрос на английском (термины MeSH)" },
          years: { type: "number", description: "За сколько последних лет (default 5)" },
          limit: { type: "number", description: "Сколько статей (default 5, max 10)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "repertory_lookup",
      description: "Семантический поиск рубрик в реперториуме Кента по симптому/жалобе. Возвращает рубрики и средства.",
      parameters: {
        type: "object",
        properties: { complaint: { type: "string", description: "Симптом по-русски, например 'жгучая боль в простате ночью'" } },
        required: ["complaint"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "materia_medica",
      description: "Чтение разделов Materia Medica по гомеопатическому препарату.",
      parameters: {
        type: "object",
        properties: {
          remedy: { type: "string", description: "Латинское название, например 'Sabal serrulata'" },
        },
        required: ["remedy"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "treatment_catalog_search",
      description: "Поиск аптечных препаратов, БАД, пептидов в каталоге назначений профессора.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Название или показание" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "patient_lookup",
      description: "Поиск пациента по ФИО или фрагменту фамилии. Возвращает ID, ФИО, дату рождения, диагноз.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "ФИО или фамилия" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "patient_protocols",
      description: "Чтение протоколов визитов и УЗИ конкретного пациента.",
      parameters: {
        type: "object",
        properties: { patient_id: { type: "string", description: "UUID пациента" } },
        required: ["patient_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "vault_search",
      description: "Семантический поиск по личному Vault профессора (заметки в Obsidian-подобной базе). Используй когда вопрос может касаться ранее записанных мыслей, наблюдений, выводов.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Запрос по смыслу" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_assignment",
      description: "ОПАСНО: создаёт черновик назначения (препарат + потенция/доза + длительность) для визита. Требует подтверждения врача.",
      parameters: {
        type: "object",
        properties: {
          patient_id: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string", description: "pharmacy|supplement|peptide|homeopathy" },
                dosage: { type: "string" },
                frequency: { type: "string" },
                duration: { type: "string" },
                rationale: { type: "string" },
              },
              required: ["name", "category", "dosage"],
            },
          },
        },
        required: ["patient_id", "items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_prescription",
      description: "ОПАСНО: создаёт черновик рецепта 107-1/у. Только для аптечных препаратов. Требует подтверждения.",
      parameters: {
        type: "object",
        properties: {
          patient_id: { type: "string" },
          items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, signa: { type: "string" } } } },
        },
        required: ["patient_id", "items"],
      },
    },
  },
];

const APPROVAL_REQUIRED = new Set(["draft_assignment", "draft_prescription"]);

// ============ TOOL EXECUTORS ============
async function runTool(name: string, args: any, sb: any): Promise<any> {
  try {
    switch (name) {
      case "perplexity_search": {
        if (!PERPLEXITY_API_KEY) return { error: "PERPLEXITY_API_KEY не настроен" };
        const r = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "sonar",
            messages: [{ role: "user", content: args.query }],
          }),
        });
        const data = await r.json();
        return {
          content: data.choices?.[0]?.message?.content ?? "",
          citations: data.citations ?? [],
        };
      }
      case "pubmed_search": {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/ai-pubmed`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: args.query, years: args.years ?? 5, limit: Math.min(args.limit ?? 5, 10) }),
        });
        if (!r.ok) return { error: `pubmed: ${r.status}` };
        const data = await r.json();
        return { articles: (data.articles ?? data.sources ?? []).slice(0, args.limit ?? 5) };
      }
      case "repertory_lookup": {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/repertorize-from-complaint`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ complaint: args.complaint, mode: "quick" }),
        });
        if (!r.ok) return { error: `repertory: ${r.status}` };
        const data = await r.json();
        return {
          rubrics: (data.rubrics ?? []).slice(0, 10).map((x: any) => ({ text: x.rubric_text, remedies: x.top_remedies })),
          top_remedies: (data.ranked_remedies ?? data.remedies ?? []).slice(0, 10),
        };
      }
      case "materia_medica": {
        const { data } = await sb
          .from("materia_medica_sections")
          .select("remedy_name, section_type, content_ru, content_en")
          .ilike("remedy_name", `%${args.remedy}%`)
          .limit(8);
        return { sections: data ?? [] };
      }
      case "treatment_catalog_search": {
        const { data } = await sb
          .from("treatment_catalog")
          .select("id, name, category, form, indications, default_dosage, default_duration")
          .or(`name.ilike.%${args.query}%,indications.ilike.%${args.query}%`)
          .limit(15);
        return { items: data ?? [] };
      }
      case "patient_lookup": {
        const { data } = await sb
          .from("patients")
          .select("id, full_name, date_of_birth, diagnosis")
          .ilike("full_name", `%${args.query}%`)
          .limit(10);
        return { patients: data ?? [] };
      }
      case "patient_protocols": {
        const { data: visits } = await sb
          .from("patient_visits")
          .select("id, visit_date, visit_type, protocol_data")
          .eq("patient_id", args.patient_id)
          .order("visit_date", { ascending: false })
          .limit(5);
        const { data: us } = await sb
          .from("ultrasound_results")
          .select("study_type, study_date, conclusion")
          .eq("patient_id", args.patient_id)
          .order("study_date", { ascending: false })
          .limit(5);
        return { visits: visits ?? [], ultrasound: us ?? [] };
      }
      default:
        return { error: `unknown tool ${name}` };
    }
  } catch (e: any) {
    return { error: String(e?.message ?? e) };
  }
}

// ============ MAIN HANDLER ============
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const enc = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const send = (event: string, data: any) =>
    writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

  (async () => {
    try {
      const auth = req.headers.get("Authorization") ?? "";
      const jwt = auth.replace(/^Bearer\s+/i, "");
      const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const { data: { user } } = await sbUser.auth.getUser();
      if (!user) { await send("error", { message: "Не авторизован" }); return writer.close(); }

      const sbSvc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const body = await req.json();
      const { task, runId: existingRunId, model = "openai/gpt-5.4", patient_id, approval } = body;

      // Resume existing run or create new
      let runId = existingRunId;
      let messages: any[] = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: task }];
      let steps: any[] = [];

      if (runId) {
        const { data: run } = await sbSvc.from("agent_runs").select("*").eq("id", runId).single();
        if (run) {
          messages = run.steps?.find((s: any) => s.type === "messages")?.messages ?? messages;
          steps = run.steps ?? [];
          if (approval && run.pending_approval) {
            // Inject approval result back as tool_result
            messages.push({
              role: "tool",
              tool_call_id: run.pending_approval.tool_call_id,
              content: JSON.stringify(approval.approved
                ? { status: "approved", saved: true, ...run.pending_approval.args }
                : { status: "rejected", reason: approval.reason ?? "врач отклонил" }),
            });
            steps.push({ type: "approval_result", approved: approval.approved, at: new Date().toISOString() });
            await sbSvc.from("agent_runs").update({ status: "running", pending_approval: null, steps }).eq("id", runId);
          }
        }
      } else {
        const { data: newRun, error } = await sbSvc.from("agent_runs").insert({
          user_id: user.id, patient_id, task, model, steps: [], status: "running",
        }).select().single();
        if (error) throw error;
        runId = newRun.id;
      }

      await send("run_started", { runId });

      // ============ MAIN LOOP ============
      let stepCount = steps.filter((s: any) => s.type === "model_call").length;
      while (stepCount < MAX_STEPS) {
        stepCount++;
        await send("step", { n: stepCount, status: "thinking" });

        const resp = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: {
            "Lovable-API-Key": LOVABLE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            tools: TOOLS,
            tool_choice: "auto",
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          if (resp.status === 429) { await send("error", { message: "Лимит запросов, попробуйте позже" }); break; }
          if (resp.status === 402) { await send("error", { message: "Закончились кредиты ИИ" }); break; }
          await send("error", { message: `Gateway ${resp.status}: ${txt.slice(0, 300)}` }); break;
        }

        const data = await resp.json();
        const msg = data.choices?.[0]?.message;
        if (!msg) { await send("error", { message: "Пустой ответ модели" }); break; }
        messages.push(msg);

        const toolCalls = msg.tool_calls ?? [];

        // Final answer (no tool calls)
        if (!toolCalls.length) {
          const final = msg.content ?? "";
          steps.push({ type: "final", content: final, at: new Date().toISOString() });
          await sbSvc.from("agent_runs").update({
            status: "completed", final_answer: final, steps, total_steps: stepCount,
          }).eq("id", runId);
          await send("final", { content: final });
          break;
        }

        // Execute tool calls
        let pausedForApproval = false;
        for (const tc of toolCalls) {
          const name = tc.function.name;
          let args: any = {};
          try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}

          await send("tool_call", { id: tc.id, name, args, step: stepCount });
          steps.push({ type: "tool_call", id: tc.id, name, args, at: new Date().toISOString() });

          if (APPROVAL_REQUIRED.has(name)) {
            // Pause, save pending_approval, await user
            await sbSvc.from("agent_runs").update({
              status: "awaiting_approval",
              pending_approval: { tool_call_id: tc.id, name, args },
              steps, total_steps: stepCount,
            }).eq("id", runId);
            await send("awaiting_approval", { tool_call_id: tc.id, name, args });
            pausedForApproval = true;
            break;
          }

          const result = await runTool(name, args, sbSvc);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result).slice(0, 12000),
          });
          steps.push({ type: "tool_result", id: tc.id, name, result, at: new Date().toISOString() });
          await send("tool_result", { id: tc.id, name, result });
        }

        if (pausedForApproval) break;
        await sbSvc.from("agent_runs").update({ steps, total_steps: stepCount }).eq("id", runId);
      }

      if (stepCount >= MAX_STEPS) {
        await send("error", { message: `Достигнут лимит ${MAX_STEPS} шагов` });
        await sbSvc.from("agent_runs").update({ status: "limit_reached", steps, total_steps: stepCount }).eq("id", runId);
      }
    } catch (e: any) {
      await send("error", { message: String(e?.message ?? e) });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
});
