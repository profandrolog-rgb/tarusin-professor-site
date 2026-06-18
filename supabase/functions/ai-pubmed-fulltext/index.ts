// Fetches full text of a PMC-open article and asks the model to analyze it in Russian.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function stripXml(xml: string): string {
  // Remove journal-meta/article-meta noise, keep body
  const bodyMatch = xml.match(/<body[\s\S]*?<\/body>/i);
  let chunk = bodyMatch ? bodyMatch[0] : xml;
  // Drop tables of figures contents (keep captions)
  chunk = chunk.replace(/<table-wrap[\s\S]*?<\/table-wrap>/g, " [таблица] ");
  chunk = chunk.replace(/<fig[\s\S]*?<\/fig>/g, " [рисунок] ");
  // Strip remaining XML tags
  chunk = chunk.replace(/<[^>]+>/g, " ");
  // Decode common entities
  chunk = chunk.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
  chunk = chunk.replace(/\s+/g, " ").trim();
  return chunk;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: cErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.pmid !== "string") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pmid = String(body.pmid).replace(/\D/g, "");
    const userQuestion = typeof body.question === "string" ? body.question.trim() : "";
    const systemPrompt = typeof body.system === "string" && body.system.trim() ? body.system : "";
    const rawModel = typeof body.model === "string" && body.model ? body.model : "google/gemini-2.5-flash";
    const model = rawModel.replace(/^pubmed:/, "");
    const ncbiKey = Deno.env.get("NCBI_API_KEY");
    const kp = ncbiKey ? `&api_key=${ncbiKey}` : "";

    // 1) Resolve PMCID via esummary
    let pmcid: string | undefined = typeof body.pmcid === "string" ? body.pmcid : undefined;
    let title = "";
    if (!pmcid) {
      const sumResp = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmid}${kp}`);
      const sumJson = await sumResp.json();
      const r = sumJson?.result?.[pmid];
      title = r?.title || "";
      const ids = Array.isArray(r?.articleids) ? r.articleids : [];
      pmcid = ids.find((x: any) => x?.idtype === "pmc")?.value;
    }
    if (!pmcid) {
      return new Response(JSON.stringify({
        error: "Полный текст недоступен в PMC для PMID:" + pmid,
        has_fulltext: false,
      }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const pmcNum = String(pmcid).replace(/^PMC/i, "");

    // 2) efetch full XML
    const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcNum}&rettype=xml${kp}`;
    const fetchResp = await fetch(efetchUrl);
    if (!fetchResp.ok) {
      const t = await fetchResp.text().catch(() => "");
      return new Response(JSON.stringify({ error: "PMC efetch failed", details: t.slice(0, 400), has_fulltext: false }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const xml = await fetchResp.text();
    const text = stripXml(xml).slice(0, 60000); // cap to keep request reasonable

    if (!text || text.length < 200) {
      return new Response(JSON.stringify({
        error: "Полный текст в PMC пуст или недоступен (возможно, только аннотация).",
        has_fulltext: false,
      }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3) Ask the model to analyze
    const sys = (systemPrompt ? systemPrompt + "\n\n" : "") +
      "Тебе дан полный текст научной статьи из PMC. Сделай подробный клинический разбор на русском: " +
      "(1) дизайн/выборка, (2) методы, (3) ключевые результаты с цифрами, (4) ограничения и риски смещения, " +
      "(5) практические выводы для специалиста, (6) применимость к российской/детской практике. " +
      "Цитируй конкретные места короткими дословными выдержками в кавычках. " +
      "В конце укажи PMID:" + pmid + (pmcid ? ` / ${pmcid}` : "") + ".";
    const userMsg = (userQuestion ? `Вопрос специалиста: ${userQuestion}\n\n` : "") +
      `СТАТЬЯ (PMC, PMID:${pmid}):\n\n${text}`;

    const ansResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
        provider: { sort: "throughput" },
      }),
    });
    if (!ansResp.ok) {
      const t = await ansResp.text().catch(() => "");
      return new Response(JSON.stringify({ error: "OpenRouter failed", details: t.slice(0, 500), has_fulltext: true, pmcid }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await ansResp.json();
    const analysis = j?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({
      analysis, pmid, pmcid, has_fulltext: true,
      pmc_url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
      char_count: text.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-pubmed-fulltext error", e);
    return new Response(JSON.stringify({ error: "Internal" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
