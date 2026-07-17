import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const token = Deno.env.get("TIMEWEB_API_TOKEN");
  if (!token) return new Response(JSON.stringify({ error: "no token" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const auth = { Authorization: `Bearer ${token}` };
  const url = new URL(req.url);
  const appId = url.searchParams.get("app_id");
  const action = url.searchParams.get("action"); // "deploy" to force new deploy
  const commit = url.searchParams.get("commit");

  try {
    if (appId && action === "deploy") {
      const paths = [
        { method: "POST", path: `/api/v1/apps/${appId}/deploy`, body: commit ? { commit_sha: commit } : {} },
        { method: "POST", path: `/api/v1/apps/${appId}/deploys`, body: commit ? { commit_sha: commit } : {} },
      ];
      const probes: any[] = [];
      for (const p of paths) {
        const r = await fetch(`https://api.timeweb.cloud${p.path}`, { method: p.method, headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(p.body) });
        const t = await r.text();
        probes.push({ ...p, status: r.status, body: t.slice(0, 2000) });
      }
      return new Response(JSON.stringify({ probes }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (appId) {
      const [appR, depR] = await Promise.all([
        fetch(`https://api.timeweb.cloud/api/v1/apps/${appId}`, { headers: auth }),
        fetch(`https://api.timeweb.cloud/api/v1/apps/${appId}/deploys?limit=3`, { headers: auth }),
      ]);
      return new Response(JSON.stringify({ app: await appR.json().catch(()=>null), deploys: await depR.json().catch(()=>null) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const r = await fetch(`https://api.timeweb.cloud/api/v1/apps?limit=100`, { headers: auth });
    const body = await r.json();
    return new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
