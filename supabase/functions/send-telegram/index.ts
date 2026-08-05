// ============================================================
// Edge Function: send-telegram
//
// نقطة الإرسال الموحّدة والوحيدة لأي إشعار تيليجرام في النظام كله.
// بتستقبل: نوع الإشعار (للتسجيل فقط) + الجمهور المستهدف + نص الرسالة،
// وهي المسؤولة عن:
//   - تحديد المستلمين فعليًا من جدول telegram_users (مفيش Chat ID
//     متكتوب يدوي أو مخزّن في الكود أبدًا — كله من قاعدة البيانات)
//   - إرسال الرسالة لكل واحد فيهم على حدة، وفشل واحد ميوقفش الباقيين
//   - اكتشاف حظر البوت تلقائيًا وتعطيل صاحبه فورًا
//   - تسجيل كل محاولة (نجاح / فشل / حظر) في telegram_send_log
//
// شكل الجمهور المستهدف (target) في جسم الطلب:
//   { mode: "all" }
//   { mode: "role", role: "admin" }
//   { mode: "user", telegramUserId: "..." }
//   { mode: "group", groupId: "..." }
//
// لإضافة نوع إشعار جديد مستقبلًا: مفيش أي تعديل مطلوب في الملف ده —
// بس كوّن النص المناسب وحدد الجمهور من مكان الحدث نفسه (زي تنبيه
// المخزون، أو التقرير اليومي، أو أي ميزة جديدة) ونادي الفنكشن دي.
//
// مين يقدر ينادي الفنكشن دي:
//   - مستخدم مسجّل دخول بدوره "admin" (إرسال يدوي من الواجهة) — عبر JWT عادي
//   - فنكشنات تانية جوه نفس المشروع (بدل ما تتكلم مع تيليجرام بنفسها) —
//     عبر سر داخلي مشترك (INTERNAL_FUNCTIONS_SECRET) بدل توكن مستخدم حقيقي
//
// النشر:
//   supabase functions deploy send-telegram
// (اختياري) لو هتستخدمها من فنكشن تانية:
//   supabase secrets set INTERNAL_FUNCTIONS_SECRET=<قيمة عشوائية طويلة من عندك>
// ============================================================

import { getAdminClient } from "../_shared/supabase-admin.ts";
import { json, corsHeaders } from "../_shared/cors.ts";
import { sendTelegramMessage } from "../_shared/telegram-api.ts";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTIONS_SECRET");
const CONCURRENCY = 10; // إرسال دفعات صغيرة بالتوازي، يحترم حدود تيليجرام (~30 رسالة/ثانية)

type Target =
  | { mode: "all" }
  | { mode: "role"; role: string }
  | { mode: "user"; telegramUserId: string }
  | { mode: "group"; groupId: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = getAdminClient();

  try {
    // ---------------- التحقق من الصلاحية ----------------
    const internalHeader = req.headers.get("X-Internal-Secret");
    const isInternalCall = !!INTERNAL_SECRET && internalHeader === INTERNAL_SECRET;

    if (!isInternalCall) {
      const authHeader = req.headers.get("Authorization") || "";
      const callerToken = authHeader.replace("Bearer ", "");
      if (!callerToken) return json({ error: "غير مصرح — سجّل دخولك تاني" }, 401);

      const { data: callerData, error: callerErr } = await admin.auth.getUser(callerToken);
      if (callerErr || !callerData?.user) {
        return json({ error: "الجلسة غير صالحة — سجّل دخولك تاني" }, 401);
      }

      const { data: callerProfile } = await admin
        .from("profiles")
        .select("role, is_active")
        .eq("id", callerData.user.id)
        .single();

      if (!callerProfile || callerProfile.role !== "admin" || callerProfile.is_active === false) {
        return json({ error: "الصلاحية دي لمدير النظام فقط" }, 403);
      }
    }

    const body = await req.json();
    const { type, target, message } = body as { type?: string; target?: Target; message?: string };

    if (!message || typeof message !== "string") {
      return json({ error: "نص الرسالة مطلوب" }, 400);
    }
    if (!target || !target.mode) {
      return json({ error: "لازم تحديد الجمهور المستهدف (target)" }, 400);
    }

    // ---------------- توكن البوت (من الإعدادات، مفيش قيم ثابتة بالكود) ----------------
    const { data: settingsRow } = await admin
      .from("settings")
      .select("telegram_bot_token")
      .eq("id", 1)
      .maybeSingle();
    const botToken = settingsRow?.telegram_bot_token;
    if (!botToken) {
      return json({ error: "توكن بوت تيليجرام غير مضبوط في الإعدادات" }, 400);
    }

    // ---------------- تحديد المستلمين ----------------
    let q = admin.from("telegram_users").select("id, chat_id").eq("is_active", true);

    if (target.mode === "role") {
      if (!target.role) return json({ error: "الدور غير محدد" }, 400);
      q = q.eq("role", target.role);
    } else if (target.mode === "user") {
      if (!target.telegramUserId) return json({ error: "المستخدم غير محدد" }, 400);
      q = q.eq("id", target.telegramUserId);
    } else if (target.mode === "group") {
      if (!target.groupId) return json({ error: "المجموعة غير محددة" }, 400);
      const { data: members } = await admin
        .from("telegram_group_members")
        .select("telegram_user_id")
        .eq("group_id", target.groupId);
      const ids = (members || []).map((m: { telegram_user_id: string }) => m.telegram_user_id);
      if (!ids.length) return json({ total: 0, sent: 0, failed: 0, blocked: 0 });
      q = q.in("id", ids);
    } else if (target.mode !== "all") {
      return json({ error: "target.mode غير معروف" }, 400);
    }

    const { data: recipients, error: recErr } = await q;
    if (recErr) return json({ error: recErr.message }, 400);
    if (!recipients || !recipients.length) {
      return json({ total: 0, sent: 0, failed: 0, blocked: 0 });
    }

    // ---------------- الإرسال على دفعات صغيرة متوازية ----------------
    let sent = 0, failed = 0, blocked = 0;
    const logRows: Record<string, unknown>[] = [];

    for (let i = 0; i < recipients.length; i += CONCURRENCY) {
      const batch = recipients.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (r: { id: string; chat_id: number }) => {
          const result = await sendTelegramMessage(botToken, r.chat_id, message);
          const preview = message.slice(0, 120);

          if (result.ok) {
            sent++;
            logRows.push({ notification_type: type || null, telegram_user_id: r.id, chat_id: r.chat_id, status: "sent", message_preview: preview });
          } else if (result.blocked) {
            blocked++;
            await admin.from("telegram_users").update({ is_active: false, blocked_at: new Date().toISOString() }).eq("id", r.id);
            logRows.push({ notification_type: type || null, telegram_user_id: r.id, chat_id: r.chat_id, status: "blocked", error_message: result.errorMessage, message_preview: preview });
          } else {
            failed++;
            logRows.push({ notification_type: type || null, telegram_user_id: r.id, chat_id: r.chat_id, status: "failed", error_message: result.errorMessage, message_preview: preview });
          }
        })
      );
    }

    if (logRows.length) await admin.from("telegram_send_log").insert(logRows);

    return json({ total: recipients.length, sent, failed, blocked });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "حدث خطأ غير متوقع في الخادم — " + msg }, 500);
  }
});
