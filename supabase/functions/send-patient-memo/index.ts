// Send patient memo via Email / Telegram / Link
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SENDER_DOMAIN = "notify.tarusin.pro";
const FROM_EMAIL = `noreply@${SENDER_DOMAIN}`;
const FROM_NAME = "МАЦ Тарусин";

interface SendBody {
  plan_id: string;
  channel: "email" | "telegram" | "link";
  content_kind: "link" | "pdf" | "both";
  message: string;
  recipient?: string; // explicit override
  pdf_url?: string;   // signed URL to PDF in memo-pdfs bucket
  memo_url: string;   // full URL to online memo (already constructed client-side)
}

async function logSend(supabase: any, row: Record<string, any>) {
  try {
    await supabase.from("memo_send_log").insert(row);
  } catch (e) {
    console.error("memo_send_log insert failed", e);
  }
}

async function sendEmail(opts: {
  to: string; subject: string; html: string; text: string;
}) {
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
  const messageId = crypto.randomUUID();
  const payload = {
    to: opts.to,
    from: FROM_EMAIL,
    from_name: FROM_NAME,
    sender_domain: SENDER_DOMAIN,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    purpose: "transactional",
    label: "patient_memo",
    idempotency_key: messageId,
    message_id: messageId,
    queued_at: new Date().toISOString(),
  };
  const { error } = await adminClient.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload,
  });
  if (error) throw new Error(`enqueue_email: ${error.message}`);
}

async function sendTelegram(chatRef: string, text: string, pdfUrl?: string) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  // Telegram requires numeric chat_id OR @channel name. For private users you
  // need their numeric chat_id. We accept either a numeric id or a @username.
  const chatId = /^-?\d+$/.test(chatRef) ? chatRef : (chatRef.startsWith("@") ? chatRef : `@${chatRef}`);
  const base = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

  if (pdfUrl) {
    const r = await fetch(`${base}/sendDocument`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, document: pdfUrl, caption: text }),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(`telegram sendDocument: ${JSON.stringify(j)}`);
  } else {
    const r = await fetch(`${base}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: false }),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(`telegram sendMessage: ${JSON.stringify(j)}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = (await req.json()) as SendBody;
    if (!body?.plan_id || !body?.channel || !body?.content_kind) {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load plan + patient
    const { data: plan, error: planErr } = await admin
      .from("treatment_plans")
      .select("id, patient_id, public_hash, duration_days, patient:patients(id, full_name, email, telegram_username)")
      .eq("id", body.plan_id)
      .maybeSingle();
    if (planErr || !plan) {
      return new Response(JSON.stringify({ error: "plan_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const patient: any = (plan as any).patient || {};
    const recipient = body.recipient?.trim() ||
      (body.channel === "email" ? patient.email : body.channel === "telegram" ? patient.telegram_username : "");

    let status: "sent" | "failed" = "sent";
    let errorText: string | null = null;

    const linkBlock = body.content_kind !== "pdf" ? `\n\nОнлайн-памятка: ${body.memo_url}` : "";
    const pdfBlock  = body.pdf_url && body.content_kind !== "link" ? `\n\nPDF-памятка: ${body.pdf_url}` : "";
    const fullText = `${body.message}${linkBlock}${pdfBlock}`;

    try {
      if (body.channel === "email") {
        if (!recipient) throw new Error("Не указан email пациента");
        const htmlBody = `<p>${body.message.replace(/\n/g, "<br/>")}</p>` +
          (body.content_kind !== "pdf" ? `<p><a href="${body.memo_url}">Открыть онлайн-памятку</a></p>` : "") +
          (body.pdf_url && body.content_kind !== "link" ? `<p><a href="${body.pdf_url}">Скачать PDF</a></p>` : "");
        await sendEmail({
          to: recipient,
          subject: "Памятка по курсу лечения — МАЦ Тарусин",
          html: htmlBody,
          text: fullText,
        });
      } else if (body.channel === "telegram") {
        if (!recipient) throw new Error("Не указан Telegram пациента");
        await sendTelegram(recipient, fullText, body.content_kind !== "link" ? body.pdf_url : undefined);
      } else if (body.channel === "link") {
        // nothing to send server-side; just log
      } else {
        throw new Error("Неизвестный канал");
      }
    } catch (e) {
      status = "failed";
      errorText = e instanceof Error ? e.message : String(e);
    }

    await logSend(admin, {
      plan_id: body.plan_id,
      channel: body.channel,
      content_kind: body.content_kind,
      recipient: recipient || null,
      status,
      error: errorText,
      sent_by: u.user.id,
    });

    if (status === "failed") {
      return new Response(JSON.stringify({ ok: false, error: errorText }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
