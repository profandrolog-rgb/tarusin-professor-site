// Telegram-бот для пациентов с путёвкой на операцию.
// Deep-link: https://t.me/<bot>?start=<telegram_link_code>
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SITE_URL = Deno.env.get("SITE_URL") || "https://tarusin.pro";

async function tg(method: string, payload: Record<string, unknown>) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error(`telegram ${method} failed`, JSON.stringify(j));
}

function keyboard(hash: string) {
  return {
    inline_keyboard: [
      [{ text: "✅ Анализы сдал", callback_data: "labs_ready" }],
      [{ text: "🗓 Нужно перенести", callback_data: "postponed" }],
      [{ text: "❌ Отказываюсь от операции", callback_data: "declined" }],
      [{ text: "📄 Моя подготовка", url: `${SITE_URL}/s/${hash}` }],
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const update = await req.json();
    const msg = update.message ?? update.edited_message;
    const cb = update.callback_query;

    // Подписка по deep-link /start <code>
    if (msg?.text?.startsWith("/start")) {
      const chatId = msg.chat.id;
      const code = msg.text.split(/\s+/)[1]?.trim();
      if (!code) {
        await tg("sendMessage", {
          chat_id: chatId,
          text: "Здравствуйте! Чтобы получать напоминания о подготовке к операции, откройте бот по ссылке или QR-коду из вашей путёвки.",
        });
        return new Response(JSON.stringify({ ok: true }));
      }
      const { data: ref } = await admin
        .from("surgery_referrals")
        .select("id, full_name, public_hash")
        .eq("telegram_link_code", code)
        .maybeSingle();
      if (!ref) {
        await tg("sendMessage", { chat_id: chatId, text: "Путёвка по этому коду не найдена. Уточните у координатора." });
        return new Response(JSON.stringify({ ok: true }));
      }
      await admin
        .from("surgery_referrals")
        .update({ telegram_chat_id: String(chatId), last_contact_at: new Date().toISOString() })
        .eq("id", ref.id);
      await admin.from("surgery_referral_events").insert({
        referral_id: ref.id,
        event_type: "telegram_linked",
        comment: "Пациент подписался на напоминания",
        actor_kind: "patient",
      });
      await tg("sendMessage", {
        chat_id: chatId,
        text: `${ref.full_name}, подписка оформлена. Я напомню про обследования и дату операции. Кнопки ниже — для быстрой связи.`,
        reply_markup: keyboard(ref.public_hash),
      });
      return new Response(JSON.stringify({ ok: true }));
    }

    // Кнопки статусов
    if (cb) {
      const chatId = cb.message?.chat?.id;
      const action = String(cb.data || "");
      const { data: ref } = await admin
        .from("surgery_referrals")
        .select("id, public_hash, coordinator_phone")
        .eq("telegram_chat_id", String(chatId))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      await tg("answerCallbackQuery", { callback_query_id: cb.id });

      if (!ref) {
        await tg("sendMessage", { chat_id: chatId, text: "Путёвка не найдена. Свяжитесь с координатором." });
        return new Response(JSON.stringify({ ok: true }));
      }

      const allowed = ["labs_ready", "postponed", "declined"];
      if (!allowed.includes(action)) return new Response(JSON.stringify({ ok: true }));

      await admin
        .from("surgery_referrals")
        .update({ status: action, last_contact_at: new Date().toISOString() })
        .eq("id", ref.id);
      await admin.from("surgery_referral_events").insert({
        referral_id: ref.id,
        event_type: "patient_action",
        status: action,
        comment: `Пациент нажал кнопку: ${action}`,
        actor_kind: "patient",
      });

      const replies: Record<string, string> = {
        labs_ready: "Спасибо! Координатор свяжется с вами для назначения даты операции.",
        postponed: `Принято. Пожалуйста, позвоните координатору: ${ref.coordinator_phone || "+7 903 005-61-11"}.`,
        declined: "Информация передана врачу. Если решение изменится — напишите в этот чат.",
      };
      await tg("sendMessage", { chat_id: chatId, text: replies[action] });
      return new Response(JSON.stringify({ ok: true }));
    }

    // Любое другое сообщение — фиксируем контакт
    if (msg?.chat?.id) {
      const { data: ref } = await admin
        .from("surgery_referrals")
        .select("id, public_hash")
        .eq("telegram_chat_id", String(msg.chat.id))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ref) {
        await admin
          .from("surgery_referrals")
          .update({ last_contact_at: new Date().toISOString() })
          .eq("id", ref.id);
        await admin.from("surgery_referral_events").insert({
          referral_id: ref.id,
          event_type: "patient_message",
          comment: String(msg.text || "").slice(0, 500),
          actor_kind: "patient",
        });
        await tg("sendMessage", {
          chat_id: msg.chat.id,
          text: "Сообщение получено — координатор его увидит. Выберите действие:",
          reply_markup: keyboard(ref.public_hash),
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error("surgery-referral-bot failed", e);
    return new Response(JSON.stringify({ error: "internal" }), { status: 500 });
  }
});
