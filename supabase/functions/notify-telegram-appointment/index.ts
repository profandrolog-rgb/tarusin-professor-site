// Sends a Telegram notification when a new appointment_requests row is inserted.
// Invoked by a database trigger (pg_net) on INSERT.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const CHAT_ID = "7373296712";

function formatMoscowTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const msk = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(msk.getUTCDate())}.${pad(msk.getUTCMonth() + 1)}.${msk.getUTCFullYear()}, ${pad(msk.getUTCHours())}:${pad(msk.getUTCMinutes())}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

    const body = await req.json().catch(() => ({}));
    // pg_net webhook payload shape: { type, table, record, schema, old_record }
    const record = body?.record ?? body;

    const name = record?.parent_name || "—";
    const phone = record?.contact_phone || "";
    const email = record?.contact_email || "";
    const contact = [phone, email].filter(Boolean).join(" / ") || "—";
    const childAge = record?.child_age || "—";
    const problem = record?.problem_description || "—";
    const createdAt = record?.created_at || new Date().toISOString();

    const text =
      `🔔 <b>Новая заявка на приём</b>\n\n` +
      `👤 <b>Имя:</b> ${escapeHtml(String(name))}\n` +
      `📞 <b>Контакт:</b> ${escapeHtml(String(contact))}\n` +
      `🧒 <b>Возраст ребёнка:</b> ${escapeHtml(String(childAge))}\n` +
      `📝 <b>Комментарий:</b>\n${escapeHtml(String(problem))}\n\n` +
      `🕒 ${escapeHtml(String(createdAt))}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });

    const tgData = await tgRes.json();
    if (!tgRes.ok || !tgData.ok) {
      console.error("Telegram API error:", tgRes.status, tgData);
      return new Response(JSON.stringify({ ok: false, status: tgRes.status, error: tgData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, message_id: tgData.result?.message_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-telegram-appointment error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
