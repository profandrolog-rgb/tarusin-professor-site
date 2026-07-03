// AI Chat proxy → OpenRouter with SSE streaming.
// Validates Supabase JWT, forwards {model, messages} to OpenRouter,
// streams chunks back to the client. OPENROUTER_API_KEY never leaves server.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_SYSTEM_PROMPT =
  "Ты — ассистент профессора Д. И. Тарусина: профессор, д.м.н., 40 лет клинического стажа, основатель детской урологии-андрологии в России, руководитель Городского центра репродуктивного здоровья детей и подростков. " +
  "Его квалификация охватывает несколько специальностей — всё подтверждено дипломами и сертификатами: " +
  "детский и взрослый уролог-андролог, оперирующий хирург (оперативная андрология); " +
  "психиатрия в объёме сексологии — вправе вести и фармакологически корректировать психические аспекты сексуальных и пубертатных расстройств, включая назначение психотропных препаратов в этом объёме; " +
  "детский эндокринолог — в зоне щитовидной железы, половой системы и надпочечников (сахарным диабетом не занимается); " +
  "травматолог-ортопед; педиатр; " +
  "второе высшее юридическое образование (гражданское право) — компетентен в медицинском праве, защите персональных данных, договорном и авторском праве, не нуждается в отсылках «обратитесь к юристу». " +
  "Это закрытый профессиональный клинико-научный инструмент для специалиста; его практика — дети, подростки и взрослые. " +
  "Отвечай как коллега-эксперт: сразу давай прямой, конкретный, доказательный ответ — дозы, диапазоны, схемы, протоколы, диф. диагноз, мониторинг; по правовым вопросам — так же предметно (нормы, статьи, формулировки, риски). " +
  "Категорически НЕ делай: не пиши «я не врач / не юрист», «не могу дать рекомендацию», «это вне компетенции уролога», «недопустимо самолечение»; " +
  "не направляй собеседника «к психиатру / эндокринологу / ортопеду / юристу / специалисту» как к единственно верной тактике — это его собственные специальности; " +
  "не отказывайся и не предостерегай из-за того, что речь о ребёнке или подростке — это его профильная работа; не начинай ответ с предупреждений. " +
  "Противопоказания, мониторинг, взаимодействия, правовые нюансы давай по существу — как коллега коллеге.";

const CHAT_FALLBACK_MODELS = [
  "google/gemini-3-flash-preview",
  "anthropic/claude-sonnet-4.5",
  "openai/gpt-5-mini",
  "deepseek/deepseek-v4-flash",
  "qwen/qwen3.6-flash",
];

const CHAT_MODEL_FALLBACKS: Record<string, string[]> = {
  "google/gemini-2.5-pro": ["google/gemini-3.1-pro-preview", "google/gemini-3-flash-preview"],
  "google/gemini-3.1-pro-preview": ["google/gemini-3-flash-preview"],
  "openai/gpt-5": ["openai/gpt-5-mini", "openai/gpt-5-chat"],
  "anthropic/claude-opus-4.8": ["anthropic/claude-sonnet-4.5"],
  "anthropic/claude-opus-4-8": ["anthropic/claude-sonnet-4.5"],
  "moonshotai/kimi-k2-thinking": ["qwen/qwen3.6-flash", "z-ai/glm-5"],
  "deepseek/deepseek-v4-pro": ["deepseek/deepseek-v4-flash", "deepseek/deepseek-v3.2"],
};

const unique = (items: string[]) => items.filter((item, index, arr) => Boolean(item) && arr.indexOf(item) === index);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.model !== "string" || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawModelInput = (body.model as string).replace(/^pubmed:/, "");
    const isVenice = rawModelInput.startsWith("venice/");
    const isPerplexity = rawModelInput.startsWith("perplexity/");
    const rawModel = isVenice
      ? rawModelInput.slice("venice/".length)
      : isPerplexity
        ? rawModelInput.slice("perplexity/".length)
        : rawModelInput;
    const resolvedModel = !isVenice && !isPerplexity && rawModel === "x-ai/grok-4" ? "x-ai/grok-4.3" : rawModel;

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const apiKey = isVenice
      ? Deno.env.get("VENICE_API_KEY")
      : isPerplexity
        ? Deno.env.get("PERPLEXITY_API_KEY")
        : openrouterKey;
    if (!apiKey) {
      const keyName = isVenice ? "VENICE_API_KEY" : isPerplexity ? "PERPLEXITY_API_KEY" : "OPENROUTER_API_KEY";
      return new Response(JSON.stringify({ error: `${keyName} not configured` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const effort: "low" | "medium" | "high" =
      body.reasoning_effort === "high" || body.reasoning_effort === "medium"
        ? body.reasoning_effort
        : "low";
    const systemPrompt = typeof body.system === "string" && body.system.trim()
      ? body.system
      : DEFAULT_SYSTEM_PROMPT;
    const TABLE_FORMAT_RULES =
      "Форматирование таблиц (строго): " +
      "(1) Для простых табличных данных используй валидный GFM-markdown: первая строка заголовков `| A | B | C |`, ОБЯЗАТЕЛЬНАЯ строка-разделитель `| --- | --- | --- |`, далее строки данных. " +
      "(2) Если в ячейках нужны списки/несколько пунктов (например, плюсы/минусы, сравнение опций) — отдавай ПОЛНОЦЕННЫЙ HTML: `<table><thead><tr><th>…</th></tr></thead><tbody><tr><td><ul><li>…</li></ul></td></tr></tbody></table>`. Внутри `<td>` разрешены `<ul>`, `<ol>`, `<li>`, `<br>`, `<strong>`, `<em>`, `<mark>`. " +
      "(3) Никогда не смешивай в одной таблице сырые `|` GFM-синтаксиса и блочные HTML-теги. " +
      "(4) Никогда не выводи разметку таблицы как обычный текст: не оставляй видимыми символы `|`, `||`, `<br>`, `<ul>`, `<li>` без оборачивающей таблицы. Если выбрал HTML — все теги корректно закрыты; если markdown — есть строка-разделитель `---`. " +
      "(5) Не оборачивай таблицу в ```code-блоки.";
    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      { role: "system", content: TABLE_FORMAT_RULES },
      ...body.messages,
    ];


    // Venice не поддерживает наши PubMed-/web-плагины OpenRouter — отключаем.
    const webSearch = !isVenice && !isPerplexity && body.web_search === true;
    const searchSource: "web" | "pubmed" =
      body.search_source === "pubmed" ? "pubmed" : "web";
    const usePubmed = webSearch && searchSource === "pubmed" && !isPerplexity;

    // PubMed mode: fetch citations and inject them as context
    let pubmedSources: Array<{ url: string; title: string; content: string }> = [];
    let finalMessages = messagesWithSystem;
    if (usePubmed) {
      try {
        const lastUser = [...body.messages].reverse().find((m: any) => m?.role === "user");
        const userText = typeof lastUser?.content === "string"
          ? lastUser.content
          : Array.isArray(lastUser?.content)
            ? lastUser.content.filter((p: any) => p?.type === "text").map((p: any) => p.text).join(" ")
            : "";

        // 1) Ask model to formulate short English PubMed query
        let englishQuery = userText.slice(0, 200);
        try {
          const qResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: resolvedModel,
              messages: [
                { role: "system", content: "You translate a clinical question into a concise English PubMed search query (keywords, MeSH-like). Output ONLY the query, no quotes, no explanations." },
                { role: "user", content: userText },
              ],
              max_tokens: 80,
            }),
          });
          if (qResp.ok) {
            const qJson = await qResp.json();
            const q = qJson?.choices?.[0]?.message?.content?.trim();
            if (q) englishQuery = q.replace(/^["']|["']$/g, "").slice(0, 300);
          }
        } catch (_) { /* fall back to raw text */ }

        console.log("[ai-chat] pubmed query", englishQuery);

        // 2) esearch → PMIDs
        const ncbiKey = Deno.env.get("NCBI_API_KEY");
        const keyParam = ncbiKey ? `&api_key=${ncbiKey}` : "";
        const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=6&sort=relevance&term=${encodeURIComponent(englishQuery)}${keyParam}`;
        const esearchResp = await fetch(esearchUrl);
        const esearchJson = await esearchResp.json();
        const pmids: string[] = esearchJson?.esearchresult?.idlist ?? [];

        if (pmids.length) {
          // 3) esummary + efetch (abstracts) in parallel
          const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(",")}${keyParam}`;
          const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&rettype=abstract&retmode=text&id=${pmids.join(",")}${keyParam}`;
          const [sumResp, fetchResp] = await Promise.all([fetch(esummaryUrl), fetch(efetchUrl)]);
          const sumJson = await sumResp.json();
          const abstractsText = await fetchResp.text();

          // Split abstracts (PubMed separates with blank line between records)
          const abstractBlocks = abstractsText.split(/\n\n(?=\d+:\s|\n*PMID-)/g);

          pubmedSources = pmids.map((pmid, i) => {
            const r = sumJson?.result?.[pmid] || {};
            const title = r.title || "(no title)";
            const authors = Array.isArray(r.authors)
              ? r.authors.slice(0, 4).map((a: any) => a?.name).filter(Boolean).join(", ") +
                (r.authors.length > 4 ? ", et al." : "")
              : "";
            const journal = r.fulljournalname || r.source || "";
            const year = (r.pubdate || "").slice(0, 4);
            const doi = Array.isArray(r.articleids)
              ? r.articleids.find((x: any) => x?.idtype === "doi")?.value
              : undefined;
            const abstract = (abstractBlocks[i] || "").trim().slice(0, 1500);
            return {
              url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
              title: `[PMID:${pmid}] ${title}`,
              content: `${authors}. ${journal}. ${year}.${doi ? ` DOI: ${doi}.` : ""}\n${abstract}`,
            };
          });

          // 4) Inject context block before user messages
          const contextBlock = pubmedSources.map((s, i) => {
            const pmid = s.url.match(/\/(\d+)\//)?.[1] ?? "";
            const cleanTitle = s.title.replace(/^\[PMID:\d+\]\s*/, "");
            return `[${i + 1}] ${cleanTitle}${pmid ? ` (PMID:${pmid})` : ""}\n${s.content}`;
          }).join("\n\n");
          const pubmedSystem =
            "Тебе предоставлены пронумерованные аннотации из PubMed по запросу пользователя. Отвечай на русском, по существу клинического вопроса, опираясь на эти источники.\n" +
            "СТРОГИЕ ПРАВИЛА ЦИТИРОВАНИЯ:\n" +
            `• Ссылайся на источники ТОЛЬКО по их порядковому номеру в списке ниже, в формате [1], [2], … [${pubmedSources.length}].\n` +
            "• НИКОГДА не пиши PMID в тексте ответа. Не используй форму [PMID:...] и не выдумывай идентификаторы — настоящие PMID и ссылки уже показаны пользователю в карточках источников.\n" +
            "• Допустимо группировать ссылки: [1, 3] или [2][4]. Если данных недостаточно — скажи прямо.\n\n" +
            "ИСТОЧНИКИ PUBMED (запрос: \"" + englishQuery + "\"):\n\n" + contextBlock;
          finalMessages = [
            { role: "system", content: systemPrompt },
            { role: "system", content: pubmedSystem },
            ...body.messages,
          ];
        } else {
          finalMessages = [
            { role: "system", content: systemPrompt },
            { role: "system", content: `PubMed по запросу "${englishQuery}" не вернул результатов. Сообщи об этом пользователю и ответь на основе собственных знаний, отметив отсутствие источников PubMed.` },
            ...body.messages,
          ];
        }
      } catch (e) {
        console.error("[ai-chat] pubmed error", e);
      }
    }

    // Gemini Flash в режиме reasoning часто упирается в лимит времени edge-функции
    // (~5 минут) и обрывает стрим. Принудительно держим reasoning минимальным
    // для всей семьи Gemini Flash, и ставим жёсткий потолок токенов вывода.
    const isGeminiFlash = /google\/gemini-[^/]*flash/i.test(resolvedModel);
    const effectiveEffort: "low" | "medium" | "high" = isGeminiFlash ? "low" : effort;

    const makePayload = (modelId: string, gateway: "openrouter" | "venice" | "perplexity") => {
      const isAttemptGeminiFlash = /google\/gemini-[^/]*flash/i.test(modelId);
      const attemptEffort: "low" | "medium" | "high" = isAttemptGeminiFlash ? "low" : effort;
      const payload: Record<string, unknown> = {
        model: modelId,
        messages: finalMessages,
        stream: true,
        max_tokens: 8192,
      };
      if (gateway === "openrouter") {
        payload.reasoning = { effort: attemptEffort };
        payload.provider = { sort: "throughput" };
        if (webSearch && !usePubmed) payload.plugins = [{ id: "web", max_results: 5 }];
      } else if (gateway === "venice") {
        payload.venice_parameters = { include_venice_system_prompt: false };
      }
      return payload;
    };

    console.log("[ai-chat] request", JSON.stringify({
      user: claimsData.claims.sub,
      origin: req.headers.get("origin"),
      gateway: isVenice ? "venice" : isPerplexity ? "perplexity" : "openrouter",
      original_model: body.model,
      resolved_model: resolvedModel,
      messages_count: body.messages.length,
    }));

    const selectedAttempt = {
      gateway: (isVenice ? "venice" : isPerplexity ? "perplexity" : "openrouter") as "openrouter" | "venice" | "perplexity",
      model: resolvedModel,
      key: apiKey,
    };
    const fallbackModels = openrouterKey
      ? unique([...(CHAT_MODEL_FALLBACKS[resolvedModel] ?? []), ...CHAT_FALLBACK_MODELS]).filter((m) => m !== resolvedModel)
      : [];
    const attempts = [
      selectedAttempt,
      ...fallbackModels.map((m) => ({ gateway: "openrouter" as const, model: m, key: openrouterKey! })),
    ];

    let orResp: Response | null = null;
    let usedAttempt = selectedAttempt;
    let lastErrText = "";
    for (const attempt of attempts) {
      const upstreamUrl = attempt.gateway === "venice"
        ? "https://api.venice.ai/api/v1/chat/completions"
        : attempt.gateway === "perplexity"
          ? "https://api.perplexity.ai/chat/completions"
          : "https://openrouter.ai/api/v1/chat/completions";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error("timeout 45000ms")), 45_000);
      try {
        const resp = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${attempt.key}`,
            "Content-Type": "application/json",
            ...(attempt.gateway === "openrouter" ? {
              "HTTP-Referer": req.headers.get("origin") ?? "https://lovable.app",
              "X-Title": "Tarusin Cabinet AI",
            } : {}),
          },
          body: JSON.stringify(makePayload(attempt.model, attempt.gateway)),
          signal: controller.signal,
        });
        if (resp.ok && resp.body) {
          orResp = resp;
          usedAttempt = attempt;
          break;
        }
        lastErrText = await resp.text().catch(() => "");
        console.error("[ai-chat] upstream attempt failed", JSON.stringify({ status: resp.status, model: attempt.model, gateway: attempt.gateway, body_preview: lastErrText.slice(0, 500) }));
      } catch (e: any) {
        lastErrText = e?.message || String(e);
        console.error("[ai-chat] upstream attempt failed", JSON.stringify({ model: attempt.model, gateway: attempt.gateway, error: lastErrText }));
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!orResp) {
      return new Response(JSON.stringify({
        error: "All model attempts failed",
        details: lastErrText.slice(0, 1000),
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[ai-chat] openrouter response", JSON.stringify({
      status: orResp.status,
      ok: orResp.ok,
      content_type: orResp.headers.get("content-type"),
      has_body: !!orResp.body,
      used_model: usedAttempt.model,
      used_gateway: usedAttempt.gateway,
    }));

    if (!orResp.ok || !orResp.body) {
      const text = await orResp.text().catch(() => "");
      console.error("[ai-chat] OpenRouter error", JSON.stringify({
        status: orResp.status,
        model: usedAttempt.model,
        body_preview: text.slice(0, 2000),
        request_payload: {
          model: usedAttempt.model,
          messages_count: body.messages.length,
        },
      }));
      return new Response(JSON.stringify({
        error: "OpenRouter request failed",
        status: orResp.status,
        details: text.slice(0, 1000),
      }), {
        status: orResp.status === 429 ? 429 : orResp.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let outBody: ReadableStream<Uint8Array> = orResp.body;
    if (pubmedSources.length) {
      const annotations = pubmedSources.map((s) => ({
        type: "url_citation",
        url_citation: { url: s.url, title: s.title, content: s.content.slice(0, 400) },
      }));
      const annChunk = `data: ${JSON.stringify({ choices: [{ delta: { annotations } }] })}\n\n`;
      const enc = new TextEncoder();
      const dec = new TextDecoder();
      const reader = orResp.body.getReader();
      outBody = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(enc.encode(annChunk));
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          const text = dec.decode(value, { stream: true });
          if (text.includes("[DONE]")) {
            const cleaned = text.replace(/data:\s*\[DONE\]\s*\n+/g, "");
            if (cleaned) controller.enqueue(enc.encode(cleaned));
          } else {
            controller.enqueue(value);
          }
        },
        cancel() { reader.cancel(); },
      });
    }

    return new Response(outBody, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("ai-chat error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
