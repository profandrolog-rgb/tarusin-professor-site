import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TIMEWEB_APP_ID = "189038";
// Репозиторий для получения последнего коммита при ручном запуске
const GITHUB_REPO = "profandrolog-rgb/tarusin-professor-site";
const GITHUB_BRANCH = "main";

async function fetchLatestCommitSha(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) {
      console.error("GitHub API failed", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.sha ?? null;
  } catch (e) {
    console.error("GitHub fetch error", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = Deno.env.get("TIMEWEB_API_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "TIMEWEB_API_TOKEN is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Получаем commit_sha из тела запроса или из GitHub
  let commitSha: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.commit_sha === "string" && /^[0-9a-f]{40}$/.test(body.commit_sha)) {
      commitSha = body.commit_sha;
    }
  } catch { /* no body */ }

  if (!commitSha) {
    commitSha = await fetchLatestCommitSha();
  }

  if (!commitSha) {
    return new Response(
      JSON.stringify({ error: "Не удалось определить commit_sha для деплоя" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await fetch(`https://api.timeweb.cloud/api/v1/apps/${TIMEWEB_APP_ID}/deploy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ commit_sha: commitSha }),
    });

    const text = await res.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* keep text */ }

    if (!res.ok) {
      console.error("Timeweb deploy failed", res.status, text);
      return new Response(
        JSON.stringify({ error: "Timeweb API error", status: res.status, body, commit_sha: commitSha }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true, commit_sha: commitSha, body }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Trigger error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
