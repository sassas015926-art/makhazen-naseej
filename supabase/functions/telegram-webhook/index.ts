// ============================================================
// Edge Function: telegram-webhook
//
// نقطة الاتصال الوحيدة اللي تيليجرام بينادي عليها مباشرة (مش المستخدم
// ولا الفرونت إند) — في كل مرة يحصل تحديث (رسالة جديدة، حظر البوت، ...).
//
// مسؤولياتها فقط:
//   1) التأكد إن الطلب فعلاً جاي من تيليجرام (Secret Token)، مش من أي حد تاني.
//   2) لو المستخدم بعت /start → تسجيله أو تحديث بياناته تلقائيًا في
//      جدول telegram_users. الـ Chat ID بييجي من تيليجرام نفسه دايمًا —
//      مفيش أي إدخال يدوي منه أو من أي حد.
//   3) لو تيليجرام قالنا إن المستخدم حظر البوت أو سابه → تعطيله فورًا
//      عشان النظام مايحاولش يبعتله تاني لحد ما يرجع يفعّله.
//   4) (اختياري) لو /start جاله مع كود ربط (Deep Link) من داخل البرنامج
//      → ربط حسابه بحساب المستخدم الحقيقي في ERP وسحب دوره منه تلقائيًا.
//
// إعداد لازم قبل التشغيل (مرة واحدة):
//   1. supabase secrets set TELEGRAM_WEBHOOK_SECRET=<قيمة عشوائية طويلة من عندك>
//   2. supabase functions deploy telegram-webhook --no-verify-jwt
//      (--no-verify-jwt ضرورية هنا لأن تيليجرام هو اللي بينادي الفنكشن،
//       مش مستخدم مسجّل دخول عندنا، فمفيش JWT من نوعنا يتحقق منه أصلًا)
//   3. من إعدادات البرنامج (شاشة تيليجرام) اضغط "تفعيل/تحديث Webhook"
//      (ده بينادي Telegram API مباشرة من المتصفح بتوكن البوت + نفس القيمة
//       اللي حطيتها فوق في TELEGRAM_WEBHOOK_SECRET)
// ============================================================

import { getAdminClient } from "../_shared/supabase-admin.ts";
import { json } from "../_shared/cors.ts";
import { sendTelegramMessage } from "../_shared/telegram-api.ts";

const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  // تيليجرام ميبعتش غير POST — أي حاجة تانية (زي فحص صحة الرابط) نرد عليها بأمان
  if (req.method !== "POST") return json({ ok: true });

  // تحقق إن الطلب فعلاً جاي من تيليجرام مش من حد بيحاول ينادي الرابط بنفسه
  const incomingSecret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!WEBHOOK_SECRET || incomingSecret !== WEBHOOK_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  const admin = getAdminClient();

  try {
    const update = await req.json();

    // ---------------- المستخدم حظر البوت / سابه / رجّع فعّله ----------------
    const myChatMember = update.my_chat_member;
    if (myChatMember) {
      const status = myChatMember.new_chat_member?.status;
      const telegramId = myChatMember.from?.id;

      if (telegramId && (status === "kicked" || status === "left")) {
        await admin
          .from("telegram_users")
          .update({ is_active: false, blocked_at: new Date().toISOString() })
          .eq("telegram_id", telegramId);
      } else if (
        telegramId &&
        (status === "member" || status === "administrator")
      ) {
        await admin
          .from("telegram_users")
          .update({ is_active: true, blocked_at: null })
          .eq("telegram_id", telegramId);
      }
      return json({ ok: true });
    }

    // ---------------- رسالة عادية (غالبًا /start) ----------------
    const message = update.message;
    if (!message || !message.from) return json({ ok: true });

    const from = message.from;
    const chatId = message.chat?.id ?? from.id;
    const text: string = message.text || "";
    const nowIso = new Date().toISOString();

    const { data: existing } = await admin
      .from("telegram_users")
      .select("id")
      .eq("telegram_id", from.id)
      .maybeSingle();

    const baseRow = {
      telegram_id: from.id,
      chat_id: chatId,
      first_name: from.first_name || null,
      last_name: from.last_name || null,
      username: from.username || null,
      is_active: true,
      blocked_at: null,
      last_seen_at: nowIso,
    };

    let telegramUserId: string;
    if (existing) {
      await admin.from("telegram_users").update(baseRow).eq("id", existing.id);
      telegramUserId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await admin
        .from("telegram_users")
        .insert(baseRow)
        .select("id")
        .single();
      if (insErr) throw insErr;
      telegramUserId = inserted.id;
    }

    if (text.startsWith("/start")) {
      // ربط اختياري بحساب داخل البرنامج عن طريق كود دعوة (Deep Link)
      const linkToken = text.split(" ")[1];
      if (linkToken) {
        const { data: tokenRow } = await admin
          .from("telegram_link_tokens")
          .select("token, profile_id, expires_at, used_at")
          .eq("token", linkToken)
          .maybeSingle();

        if (
          tokenRow &&
          !tokenRow.used_at &&
          new Date(tokenRow.expires_at) > new Date()
        ) {
          const { data: profile } = await admin
            .from("profiles")
            .select("role")
            .eq("id", tokenRow.profile_id)
            .maybeSingle();

          await admin
            .from("telegram_users")
            .update({
              linked_profile_id: tokenRow.profile_id,
              role: profile?.role || null,
            })
            .eq("id", telegramUserId);

          await admin
            .from("telegram_link_tokens")
            .update({ used_at: nowIso })
            .eq("token", linkToken);
        }
      }

      // رد ترحيبي فوري يأكّد للمستخدم إن التسجيل نجح
      const { data: settingsRow } = await admin
        .from("settings")
        .select("telegram_bot_token")
        .eq("id", 1)
        .maybeSingle();
      const botToken = settingsRow?.telegram_bot_token;

      if (botToken) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `مرحبًا ${from.first_name || ""} 👋\nتم تسجيلك بنجاح في نظام إشعارات المخزن، وهتوصلك التنبيهات هنا تلقائيًا أول ما تحصل.`
        );
      }
    }

    return json({ ok: true });
  } catch (e) {
    console.error("telegram-webhook error:", e);
    // نرجّع 200 دايمًا هنا حتى لو حصل خطأ داخلي، عشان تيليجرام ميعملش
    // إعادة محاولة لا نهائية على نفس التحديث (سلوك موصى بيه رسميًا من تيليجرام)
    return json({ ok: true });
  }
});
