// AI PubMed: translates question to English query, applies filters, calls NCBI E-utilities,
// then asks the model for a Russian answer with [PMID:xxx] citations.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AGE_MESH: Record<string, string> = {
  infant: "infant[mesh]",
  child: "child[mesh]",
  adolescent: "adolescent[mesh]",
  adult: "adult[mesh]",
  aged: "aged[mesh]",
  male: "male[mesh]",
  female: "female[mesh]",
};

function buildTerm(base: string, f: any): string {
  const parts: string[] = [base.trim()];
  if (Array.isArray(f.article_types) && f.article_types.length) {
    parts.push("(" + f.article_types.map((t: string) => `"${t}"[pt]`).join(" OR ") + ")");
  }
  if (Array.isArray(f.ages) && f.ages.length) {
    const m = f.ages.filter((a: string) => AGE_MESH[a]).map((a: string) => AGE_MESH[a]);
    if (m.length) parts.push("(" + m.join(" OR ") + ")");
  }
  if (f.humans_only !== false) parts.push("humans[mesh]");
  if (Array.isArray(f.languages) && f.languages.length) {
    parts.push("(" + f.languages.map((l: string) => `${l}[lang]`).join(" OR ") + ")");
  }
  return parts.join(" AND ");
}

function dateRange(f: any): string {
  const p = f.period || {};
  const today = new Date();
  let mindate: string | null = null;
  let maxdate: string | null = null;
  if (p.years_back && Number.isFinite(Number(p.years_back))) {
    const d = new Date(today);
    d.setFullYear(today.getFullYear() - Number(p.years_back));
    const fmt = (x: Date) =>
      `${x.getFullYear()}/${String(x.getMonth() + 1).padStart(2, "0")}/${String(x.getDate()).padStart(2, "0")}`;
    mindate = fmt(d);
    maxdate = fmt(today);
  } else if (p.from) {
    mindate = p.from;
    maxdate = p.to || `${today.getFullYear()}/12/31`;
  }
  if (!mindate) return "";
  return `&datetype=pdat&mindate=${encodeURIComponent(mindate)}&maxdate=${encodeURIComponent(maxdate!)}`;
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
    if (!body || typeof body.question !== "string") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const question = body.question.trim();
    const filters = body.filters || {};
    const retmax = Math.min(50, Math.max(1, Number(filters.retmax) || 10));
    const retstart = Math.max(0, Number(body.retstart) || 0);
    const sort = filters.sort === "pub_date" ? "pub_date" : "relevance";
    const model = typeof body.model === "string" && body.model ? body.model : "google/gemini-2.5-flash";
    const systemPrompt = typeof body.system === "string" && body.system.trim() ? body.system : "";
    const skipAnswer = body.skip_answer === true;
    // Optional: caller can pass an explicit English query to skip re-translation (used by "Показать ещё")
    const providedQuery = typeof body.english_query === "string" && body.english_query.trim()
      ? body.english_query.trim()
      : null;

    // 1) English PubMed query
    let englishQuery = providedQuery || question;
    if (!providedQuery) {
      try {
        const qResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "Translate the clinical question into a concise English PubMed search query (keywords and MeSH-like terms). Output ONLY the query, no quotes, no explanations." },
              { role: "user", content: question },
            ],
            max_tokens: 80,
          }),
        });
        if (qResp.ok) {
          const j = await qResp.json();
          const q = j?.choices?.[0]?.message?.content?.trim();
          if (q) englishQuery = q.replace(/^["']|["']$/g, "").slice(0, 300);
        }
      } catch (_) { /* fallback to raw text */ }
    }

    const term = buildTerm(englishQuery, filters);
    const ncbiKey = Deno.env.get("NCBI_API_KEY");
    const kp = ncbiKey ? `&api_key=${ncbiKey}` : "";

    // 2) esearch
    const esearchUrl =
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json` +
      `&retmax=${retmax}&retstart=${retstart}&sort=${sort}` +
      `&term=${encodeURIComponent(term)}${dateRange(filters)}${kp}`;
    console.log("[ai-pubmed] esearch", esearchUrl);
    const esearchResp = await fetch(esearchUrl);
    if (!esearchResp.ok) {
      const t = await esearchResp.text().catch(() => "");
      return new Response(JSON.stringify({ error: "NCBI esearch failed", details: t.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const esearchJson = await esearchResp.json();
    const pmids: string[] = esearchJson?.esearchresult?.idlist ?? [];
    const totalCount = parseInt(esearchJson?.esearchresult?.count ?? "0", 10);

    // 3) esummary + efetch abstracts
    let sources: any[] = [];
    if (pmids.length) {
      const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(",")}${kp}`;
      const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&rettype=abstract&retmode=text&id=${pmids.join(",")}${kp}`;
      const [sumResp, fetchResp] = await Promise.all([fetch(esummaryUrl), fetch(efetchUrl)]);
      const sumJson = await sumResp.json();
      const abstractsText = await fetchResp.text();
      const blocks = abstractsText.split(/\n\n(?=\d+:\s)/g);

      sources = pmids.map((pmid, i) => {
        const r = sumJson?.result?.[pmid] || {};
        const title = r.title || "";
        const authorsArr = Array.isArray(r.authors) ? r.authors : [];
        const authors = authorsArr.slice(0, 4).map((a: any) => a?.name).filter(Boolean).join(", ") +
          (authorsArr.length > 4 ? ", et al." : "");
        const journal = r.fulljournalname || r.source || "";
        const year = (r.pubdate || "").slice(0, 4);
        const ids = Array.isArray(r.articleids) ? r.articleids : [];
        const doi = ids.find((x: any) => x?.idtype === "doi")?.value;
        const pmcid = ids.find((x: any) => x?.idtype === "pmc")?.value;
        const articleTypes: string[] = Array.isArray(r.pubtype) ? r.pubtype : [];
        const abstract = (blocks[i] || "").trim().slice(0, 2500);
        return {
          pmid, title, authors, journal, year, doi, pmcid,
          article_types: articleTypes,
          abstract,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          pmc_url: pmcid ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/` : null,
        };
      });
    }

    if (skipAnswer) {
      return new Response(JSON.stringify({
        sources, used_query: term, english_query: englishQuery, total_count: totalCount, retstart,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4) Ask the model for a Russian answer
    let answer = "";
    if (sources.length === 0) {
      answer = `По запросу «${englishQuery}» с заданными фильтрами PubMed не вернул результатов. Попробуйте ослабить фильтры (период, тип статьи, возраст) или переформулировать вопрос.`;
    } else {
      const ctx = sources.map((s, i) =>
        `[${i + 1}] ${s.title}\n${s.authors}. ${s.journal}. ${s.year}.` +
        `${s.doi ? ` DOI:${s.doi}` : ""} (PMID:${s.pmid})\n${s.abstract}`
      ).join("\n\n");
      const sys = (systemPrompt ? systemPrompt + "\n\n" : "") +
        "Тебе предоставлены пронумерованные аннотации статей из PubMed. Отвечай на русском, по существу клинического вопроса, опираясь на эти источники. " +
        "СТРОГИЕ ПРАВИЛА ЦИТИРОВАНИЯ:\n" +
        `• Ссылайся на источники ТОЛЬКО по их порядковому номеру в списке ниже, в формате [1], [2], … [${sources.length}].\n` +
        "• НИКОГДА не пиши PMID в тексте ответа. Не используй форму [PMID:...] и не выдумывай идентификаторы — настоящие PMID и ссылки уже показаны пользователю в карточках источников.\n" +
        "• Допустимо группировать ссылки: [1, 3] или [2][4]. Используй только индексы из переданного списка; если данных недостаточно — скажи прямо.\n\n" +
        `ИСТОЧНИКИ PUBMED (запрос: "${englishQuery}"):\n\n${ctx}`;
      const ansResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: sys }, { role: "user", content: question }],
          provider: { sort: "throughput" },
        }),
      });
      if (ansResp.ok) {
        const j = await ansResp.json();
        answer = j?.choices?.[0]?.message?.content ?? "";
      } else {
        const t = await ansResp.text().catch(() => "");
        console.error("[ai-pubmed] openrouter answer failed", t.slice(0, 500));
        answer = "Не удалось получить ответ модели. Источники найдены — см. список ниже.";
      }
    }

    return new Response(JSON.stringify({
      answer, sources, used_query: term, english_query: englishQuery, total_count: totalCount, retstart,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-pubmed error", e);
    return new Response(JSON.stringify({ error: "Internal" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
