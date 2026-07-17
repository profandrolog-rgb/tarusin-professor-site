import { corsHeaders } from "../_shared/cors.ts";

const TIMEWEB_APP_ID = "189038";

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

  try {
    // Параллельно: общая инфа о приложении + список деплоев
    const auth = { Authorization: `Bearer ${token}` };
    const [appRes, deploysRes] = await Promise.all([
      fetch(`https://api.timeweb.cloud/api/v1/apps/${TIMEWEB_APP_ID}`, { headers: auth }),
      fetch(`https://api.timeweb.cloud/api/v1/apps/${TIMEWEB_APP_ID}/deploys?limit=5`, { headers: auth }),
    ]);
    const res = deploysRes;
    const text = await res.text();
    const appText = await appRes.text();
    let appBody: any = appText;
    try { appBody = JSON.parse(appText); } catch { /* keep */ }
    let body: any = text;
    try { body = JSON.parse(text); } catch { /* keep text */ }

    if (!res.ok) {
      console.error("Timeweb status failed", res.status, text);
      return new Response(
        JSON.stringify({ error: "Timeweb API error", status: res.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Нормализуем ответ: API может возвращать { deploys: [...] } или { deploy: [...] }
    const deploys = body?.deploys ?? body?.deploy ?? body?.data ?? [];
    const app = appBody?.app ?? appBody ?? null;

    // Опционально подтягиваем детали/логи одного деплоя: ?deploy_id=... или ?logs=1 (последний failure).
    const url = new URL(req.url);
    const wantLogs = url.searchParams.get("logs") === "1" || url.searchParams.get("deploy_id");
    let deploy_details: any = null;
    if (wantLogs) {
      const targetId = url.searchParams.get("deploy_id")
        || deploys.find((d: any) => d.status === "failure")?.id
        || deploys[0]?.id;
      if (targetId) {
        const paths = [
          `/api/v1/apps/${TIMEWEB_APP_ID}/logs?deploy_id=${targetId}`,
          `/api/v1/apps/${TIMEWEB_APP_ID}/deploys/${targetId}/log`,
          `/api/v1/apps/${TIMEWEB_APP_ID}/deploy_logs?deploy_id=${targetId}`,
          `/api/v1/apps/${TIMEWEB_APP_ID}/log?deploy_id=${targetId}`,
          `/api/v2/apps/${TIMEWEB_APP_ID}/deploys/${targetId}`,
        ];
        const probes: any[] = [];
        for (const p of paths) {
          try {
            const r = await fetch(`https://api.timeweb.cloud${p}`, { headers: auth });
            const t = await r.text();
            probes.push({ path: p, status: r.status, body: t.slice(0, 4000) });
          } catch (e) { probes.push({ path: p, error: String(e) }); }
        }
        deploy_details = { target_deploy_id: targetId, probes };
      }
    }

    return new Response(JSON.stringify({ deploys, app, deploy_details }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Status error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
