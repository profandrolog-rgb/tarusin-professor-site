// Normalizes free-typed medication names into properly filled Rx fields (form 107-1/у).
// Step A: deterministic lookup in treatment_catalog + medication_digests cache.
// Step B: single batched AI call for the rest, cached back into medication_digests.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface RawItem {
  name: string;
  raw_text?: string | null;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
  dosage_form?: string | null;
  quantity?: number | null;
}

interface NormalizedItem {
  medication_ru_name: string;
  medication_latin_name: string;
  dosage_form: string;
  dose: string;
  quantity: number;
  frequency: string;
  duration: string;
  signa: string | null;
  source: "catalog" | "cache" | "ai" | "none";
  confidence: number;
}

const norm = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[«»"'`]/g, "")
    .replace(/\s+/g, " ");

// Название препарата без дозы/формы — для поиска и кэш-ключа.
const bareName = (s: string) =>
  norm(s)
    .replace(/\b\d+([.,]\d+)?\s*(мг|мкг|г|мл|ме|ед|%)\b/g, "")
    .replace(/\b(табл?\.?|таблетки|капс?\.?|капсулы|р-р|раствор|сироп|мазь|гель|свечи|суппозитории|спрей|капли|амп\.?|ампулы|фл\.?)\b/g, "")
    .replace(/[,;()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const [{ data: isAdmin }, { data: isEditor }] = await Promise.all([
      supabaseUser.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabaseUser.rpc("has_role", { _user_id: user.id, _role: "editor" }),
    ]);
    if (!isAdmin && !isEditor) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => null);
    const rawItems: RawItem[] = Array.isArray(body?.items) ? body.items : [];
    const cleaned = rawItems
      .map((it) => ({ ...it, name: String(it?.name ?? "").trim() }))
      .filter((it) => it.name.length > 0)
      .slice(0, 30);

    if (cleaned.length === 0) return json({ items: [] });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const results: (NormalizedItem | null)[] = cleaned.map(() => null);
    const pendingIdx: number[] = [];

    // ---------- Step A: deterministic lookup ----------
    for (let i = 0; i < cleaned.length; i++) {
      const it = cleaned[i];
      const key = bareName(it.name) || norm(it.name);

      // 1. Кэш дайджестов
      const { data: cache } = await admin
        .from("medication_digests")
        .select("medication_name, latin_name, dosage_form, default_dose, default_frequency, synonyms")
        .or(`medication_name.eq.${key},medication_name.ilike.%${key}%`)
        .limit(5);

      const cacheHit = (cache ?? []).find(
        (c: any) => c.latin_name && (norm(c.medication_name) === key || norm(c.medication_name).includes(key)),
      );

      // 2. Каталог назначений
      const { data: cat } = await admin
        .from("treatment_catalog")
        .select("name, inn, form, default_dose, dose_unit, default_frequency, default_duration_days")
        .eq("is_active", true)
        .or(`name.ilike.${key},name.ilike.${key}%,inn.ilike.${key}%`)
        .limit(5);

      const catHit = (cat ?? [])[0] as any | undefined;

      if (catHit?.inn || catHit?.form) {
        results[i] = {
          medication_ru_name: it.name,
          medication_latin_name: catHit.inn || "",
          dosage_form: it.dosage_form || catHit.form || "",
          dose: it.dose || (catHit.default_dose != null
            ? `${catHit.default_dose}${catHit.dose_unit ? " " + catHit.dose_unit : ""}`.trim()
            : ""),
          quantity: it.quantity && it.quantity > 0 ? it.quantity : 1,
          frequency: it.frequency || catHit.default_frequency || "",
          duration: it.duration || (catHit.default_duration_days ? `${catHit.default_duration_days} дн.` : ""),
          signa: it.raw_text?.trim() || null,
          source: "catalog",
          confidence: 0.9,
        };
        if (!results[i]!.medication_latin_name) pendingIdx.push(i);
        continue;
      }

      if (cacheHit) {
        results[i] = {
          medication_ru_name: it.name,
          medication_latin_name: cacheHit.latin_name || "",
          dosage_form: it.dosage_form || cacheHit.dosage_form || "",
          dose: it.dose || cacheHit.default_dose || "",
          quantity: it.quantity && it.quantity > 0 ? it.quantity : 1,
          frequency: it.frequency || cacheHit.default_frequency || "",
          duration: it.duration || "",
          signa: it.raw_text?.trim() || null,
          source: "cache",
          confidence: 0.85,
        };
        continue;
      }

      pendingIdx.push(i);
    }

    // ---------- Step B: batched AI normalization ----------
    if (pendingIdx.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        console.error("LOVABLE_API_KEY missing — skipping AI normalization");
      } else {
        const payload = pendingIdx.map((i) => {
          const it = cleaned[i];
          return {
            index: i,
            input: it.raw_text?.trim() || it.name,
            name: it.name,
            known: {
              dose: it.dose || "",
              frequency: it.frequency || "",
              duration: it.duration || "",
              dosage_form: it.dosage_form || "",
            },
          };
        });

        const systemPrompt = `Ты — клинический фармаколог, оформляющий рецепты формы 107-1/у по правилам латинской рецептурной грамматики.

Для каждого элемента входного массива определи препарат и верни поля рецепта.

Отвечай СТРОГО валидным JSON без markdown:
{"items":[{"index":<число из входа>,"medication_ru_name":"...","medication_latin_name":"...","dosage_form":"...","dose":"...","quantity":<число>,"frequency":"...","duration":"...","signa":"..."|null,"confidence":<0..1>}]}

Правила:
- medication_latin_name — строка для Rp: с формой в винительном падеже множественного числа и МНН в родительном: "Tabulettas Tamsulosini 0,4", "Capsulas Omeprazoli 0,02", "Solutionis Cyanocobalamini 0,05 % — 1 ml", "Unguentum Hydrocortisoni 1 % — 15,0". Только латиница, без кириллицы.
- Если торговое название — переведи в МНН (Омник -> Tamsulosini). МНН предпочтительнее торгового названия.
- dosage_form: tabulettae | capsulae | solutio | unguentum | suppositoria | siropus | guttae | pulvis | spray.
- dose — доза единичной формы ("0,4 мг", "5 мл", "1 %").
- quantity — D.t.d. N на курс: рассчитай из кратности и длительности (по 1 таб. 3 р/сут 10 дней -> 30). Если данных нет — разумное значение упаковки.
- frequency — по-русски: "по 1 таблетке 1 раз в день".
- duration — "10 дней", "1 месяц".
- signa — дополнительные указания (натощак, после еды, перед сном) или null.
- Известные поля из входа (known) НЕ переписывай, если они непусты — верни их как есть.
- Если препарат неизвестен/это не лекарство — верни confidence 0 и пустые поля, кроме medication_ru_name.
- Верни ровно по одному объекту на каждый index из входа.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(payload) },
            ],
          }),
        });

        if (aiRes.status === 429) return json({ error: "Слишком много запросов, попробуйте позже" }, 429);
        if (aiRes.status === 402) return json({ error: "Необходимо пополнить баланс AI" }, 402);

        if (!aiRes.ok) {
          console.error("AI error", aiRes.status, await aiRes.text());
        } else {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          let parsed: any = null;
          try {
            parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
          } catch {
            console.error("Failed to parse AI response:", content.slice(0, 500));
          }

          const aiItems: any[] = Array.isArray(parsed?.items) ? parsed.items : [];
          for (const ai of aiItems) {
            const i = typeof ai?.index === "number" ? ai.index : -1;
            if (i < 0 || i >= cleaned.length) continue;
            const it = cleaned[i];
            const latin = String(ai.medication_latin_name || "").trim();
            const prev = results[i];
            const normalized: NormalizedItem = {
              medication_ru_name: String(ai.medication_ru_name || it.name).trim(),
              medication_latin_name: latin || prev?.medication_latin_name || "",
              dosage_form: it.dosage_form || String(ai.dosage_form || prev?.dosage_form || "").trim(),
              dose: it.dose || String(ai.dose || prev?.dose || "").trim(),
              quantity: it.quantity && it.quantity > 0
                ? it.quantity
                : (typeof ai.quantity === "number" ? ai.quantity : parseInt(String(ai.quantity)) || 1),
              frequency: it.frequency || String(ai.frequency || prev?.frequency || "").trim(),
              duration: it.duration || String(ai.duration || prev?.duration || "").trim(),
              signa: ai.signa ? String(ai.signa).trim() : (it.raw_text?.trim() || null),
              source: latin ? "ai" : "none",
              confidence: typeof ai.confidence === "number" ? ai.confidence : (latin ? 0.6 : 0),
            };
            results[i] = normalized;

            // Кэшируем удачные нормализации
            if (latin && !/[А-Яа-яЁё]/.test(latin)) {
              const key = bareName(it.name) || norm(it.name);
              await admin.from("medication_digests").upsert(
                {
                  medication_name: key,
                  latin_name: latin,
                  dosage_form: normalized.dosage_form || null,
                  default_dose: normalized.dose || null,
                  default_frequency: normalized.frequency || null,
                },
                { onConflict: "medication_name" },
              );
            }
          }
        }
      }
    }

    // Fallback для всего, что осталось незаполненным
    const items = results.map((r, i) => {
      if (r) return r;
      const it = cleaned[i];
      return {
        medication_ru_name: it.name,
        medication_latin_name: "",
        dosage_form: it.dosage_form || "",
        dose: it.dose || "",
        quantity: it.quantity && it.quantity > 0 ? it.quantity : 1,
        frequency: it.frequency || "",
        duration: it.duration || "",
        signa: it.raw_text?.trim() || null,
        source: "none" as const,
        confidence: 0,
      };
    });

    return json({ items });
  } catch (e) {
    console.error("rx-normalize-items error:", e);
    return json({ error: "Не удалось нормализовать препараты" }, 500);
  }
});
