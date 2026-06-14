import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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
    return new Response(JSON.stringify({ deploys }), {
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
