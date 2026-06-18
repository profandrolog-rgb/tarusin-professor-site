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

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), {
        status: 500,
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

    const resolvedModel = body.model === "x-ai/grok-4" ? "x-ai/grok-4.3" : body.model;
    const effort: "low" | "medium" | "high" =
      body.reasoning_effort === "high" || body.reasoning_effort === "medium"
        ? body.reasoning_effort
        : "low";
    const systemPrompt = typeof body.system === "string" && body.system.trim()
      ? body.system
      : DEFAULT_SYSTEM_PROMPT;
    const messagesWithSystem = [{ role: "system", content: systemPrompt }, ...body.messages];

    const webSearch = body.web_search === true;
    const searchSource: "web" | "pubmed" =
      body.search_source === "pubmed" ? "pubmed" : "web";
    const usePubmed = webSearch && searchSource === "pubmed";

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
          const contextBlock = pubmedSources.map((s, i) =>
            `[${i + 1}] PMID:${s.url.match(/\/(\d+)\//)?.[1]} — ${s.title.replace(/^\[PMID:\d+\]\s*/, "")}\n${s.content}`
          ).join("\n\n");
          const pubmedSystem = "Тебе предоставлены аннотации из PubMed по запросу пользователя. Отвечай на русском, по существу клинического вопроса, опираясь на эти источники. После утверждений ставь ссылки в формате [PMID:XXXXXX]. Если данных недостаточно — скажи прямо.\n\nИСТОЧНИКИ PUBMED (запрос: \"" + englishQuery + "\"):\n\n" + contextBlock;
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

    const requestPayload: Record<string, unknown> = {
      model: resolvedModel,
      messages: finalMessages,
      stream: true,
      // OpenRouter unified reasoning control — works for GPT-5, Claude, Gemini, Grok
      reasoning: { effort },
      // Route to the fastest provider for the selected model (equivalent to :nitro)
      provider: { sort: "throughput" },
    };
    if (webSearch && !usePubmed) {
      requestPayload.plugins = [{ id: "web", max_results: 5 }];
    }

    console.log("[ai-chat] request", JSON.stringify({
      user: claimsData.claims.sub,
      origin: req.headers.get("origin"),
      original_model: body.model,
      resolved_model: resolvedModel,
      messages_count: body.messages.length,
      messages_preview: body.messages.map((m: any) => ({
        role: m?.role,
        content_type: Array.isArray(m?.content) ? "array" : typeof m?.content,
        content_len: typeof m?.content === "string"
          ? m.content.length
          : Array.isArray(m?.content) ? m.content.length : 0,
      })),
    }));

    const orResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.get("origin") ?? "https://lovable.app",
        "X-Title": "Tarusin Cabinet AI",
      },
      body: JSON.stringify(requestPayload),
    });

    console.log("[ai-chat] openrouter response", JSON.stringify({
      status: orResp.status,
      ok: orResp.ok,
      content_type: orResp.headers.get("content-type"),
      has_body: !!orResp.body,
    }));

    if (!orResp.ok || !orResp.body) {
      const text = await orResp.text().catch(() => "");
      console.error("[ai-chat] OpenRouter error", JSON.stringify({
        status: orResp.status,
        model: resolvedModel,
        body_preview: text.slice(0, 2000),
        request_payload: {
          model: resolvedModel,
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

    return new Response(orResp.body, {
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
