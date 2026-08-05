// Напоминания и мониторинг предоперационных пациентов.
// Запускается по крону раз в сутки и вручную из админки.
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
const COORDINATOR_CHAT_ID = Deno.env.get("SURGERY_COORDINATOR_CHAT_ID");
const SITE_URL = Deno.env.get("SITE_URL") || "https://tarusin.pro";
const SENDER_DOMAIN = "notify.tarusin.pro";

const ACTIVE = ["issued", "labs_in_progress", "labs_ready", "date_set"];
const REMINDER_DAYS = [3, 10, 21, 35, 50];

function daysBetween(a: string | null | undefined, b = new Date()): number | null {
  if (!a) return null;
  const t = new Date(a).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((b.getTime() - t) / 86400000);
}

async function tg(method: string, payload: Record<string, unknown>) {
  if (!TELEGRAM_BOT_TOKEN) return { ok: false, skipped: true };
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error(`telegram ${method} failed`, JSON.stringify(j));
  return j;
}

async function sendEmail(admin: any, to: string, subject: string, text: string) {
  const messageId = crypto.randomUUID();
  const { error } = await admin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      to,
      from: `noreply@${SENDER_DOMAIN}`,
      from_name: "МАЦ Тарусин",
      sender_domain: SENDER_DOMAIN,
      subject,
      html: `<p>${text.replace(/\n/g, "<br/>")}</p>`,
      text,
      purpose: "transactional",
      label: "surgery_referral_reminder",
      idempotency_key: messageId,
      message_id: messageId,
      queued_at: new Date().toISOString(),
    },
  });
  if (error) throw new Error(`enqueue_email: ${error.message}`);
}

function patientText(r: any, itemsLeft: number): string {
  const link = `${SITE_URL}/s/${r.public_hash}`;
  const dateLine = r.planned_date_from
    ? `Ориентировочная дата операции: ${new Date(r.planned_date_from).toLocaleDateString("ru-RU")}.`
    : "Дата операции пока не назначена.";
  return [
    `Напоминание о подготовке к операции${r.operation_name ? ` (${r.operation_name})` : ""}.`,
    dateLine,
    itemsLeft > 0
      ? `Осталось выполнить обследований: ${itemsLeft}. Отметить выполненные можно здесь: ${link}`
      : `Все обследования отмечены как выполненные. Свяжитесь с координатором для назначения даты: ${link}`,
    `Координатор: ${r.coordinator_name || "Надежда Александровна"}, ${r.coordinator_phone || "+7 903 005-61-11"}.`,
  ].join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Доступ: крон (секрет в заголовке) либо администратор/редактор
  const cronSecret = Deno.env.get("SURGERY_CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  let authorized = !!cronSecret && headerSecret === cronSecret;
  if (!authorized) {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    if (jwt) {
      const { data: claims } = await admin.auth.getClaims(jwt);
      const uid = claims?.claims?.sub as string | undefined;
      if (uid) {
        const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", uid);
        authorized = (roles || []).some((r: any) => r.role === "admin" || r.role === "editor");
      }
    }
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let patientReminders = 0;
  let digestSent = false;


  try {
    const { data: refs, error } = await admin
      .from("surgery_referrals")
      .select("*, items:surgery_referral_items(id, is_done)")
      .in("status", ACTIVE);
    if (error) throw error;

    const overdue: any[] = [];
    const soon: any[] = [];
    const lost: any[] = [];

    for (const r of refs || []) {
      const items = (r.items || []) as any[];
      const left = items.filter((i) => !i.is_done).length;
      const idleDays = daysBetween(r.last_contact_at || r.created_at) ?? 0;
      const sinceReminder = daysBetween(r.last_reminder_at);
      const sinceIssued = daysBetween(r.created_at) ?? 0;
      const daysToOp = r.planned_date_from
        ? Math.ceil((new Date(r.planned_date_from).getTime() - Date.now()) / 86400000)
        : null;

      // Классификация для сводки координатору
      if (idleDays >= 60) lost.push({ ...r, idleDays });
      else if (idleDays >= 14) overdue.push({ ...r, idleDays, left });
      if (daysToOp !== null && daysToOp >= 0 && daysToOp <= 7) soon.push({ ...r, daysToOp, left });

      // Нужно ли напоминание пациенту
      const preOpReminder = daysToOp !== null && (daysToOp === 7 || daysToOp === 1);
      const scheduleReminder = REMINDER_DAYS.includes(sinceIssued) && left > 0;
      const shouldRemind = (preOpReminder || scheduleReminder) && (sinceReminder === null || sinceReminder >= 1);

      if (!shouldRemind) continue;

      const text = patientText(r, left);
      let sent = false;
      if (r.telegram_chat_id) {
        const res = await tg("sendMessage", { chat_id: r.telegram_chat_id, text });
        sent = !!res.ok;
      } else if (r.patient_email) {
        try {
          await sendEmail(admin, r.patient_email, "Подготовка к операции — МАЦ Тарусин", text);
          sent = true;
        } catch (e) {
          console.error("email reminder failed", e);
        }
      }

      if (sent) {
        patientReminders += 1;
        await admin
          .from("surgery_referrals")
          .update({ last_reminder_at: new Date().toISOString(), reminders_sent: (r.reminders_sent || 0) + 1 })
          .eq("id", r.id);
        await admin.from("surgery_referral_events").insert({
          referral_id: r.id,
          event_type: "reminder_sent",
          comment: r.telegram_chat_id ? "Напоминание в Telegram" : "Напоминание письмом",
          actor_kind: "system",
        });
      }

      // Автоматическая пометка «потерян из виду»
      if (idleDays >= 60 && r.status !== "lost") {
        await admin.from("surgery_referrals").update({ status: "lost" }).eq("id", r.id);
        await admin.from("surgery_referral_events").insert({
          referral_id: r.id,
          event_type: "status_change",
          status: "lost",
          comment: `Нет активности ${idleDays} дн.`,
          actor_kind: "system",
        });
      }
    }

    // Сводка координатору
    if (COORDINATOR_CHAT_ID && TELEGRAM_BOT_TOKEN) {
      const fmt = (arr: any[], f: (x: any) => string) =>
        arr.length ? arr.map((x) => `• ${f(x)}`).join("\n") : "— нет";
      const text = [
        "📋 Сводка по путёвкам на операцию",
        "",
        `⏳ Без движения ≥14 дней (${overdue.length}):`,
        fmt(overdue, (x) => `${x.full_name} — ${x.idleDays} дн., осталось обследований: ${x.left}`),
        "",
        `📅 Операция в течение 7 дней (${soon.length}):`,
        fmt(soon, (x) => `${x.full_name} — через ${x.daysToOp} дн., не сдано: ${x.left}`),
        "",
        `❗ Пропали ≥60 дней (${lost.length}):`,
        fmt(lost, (x) => `${x.full_name} — ${x.idleDays} дн.`),
      ].join("\n");
      const res = await tg("sendMessage", { chat_id: COORDINATOR_CHAT_ID, text });
      digestSent = !!res.ok;
    }

    return new Response(
      JSON.stringify({ ok: true, patient_reminders: patientReminders, digest_sent: digestSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("surgery-referral-notify failed", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
