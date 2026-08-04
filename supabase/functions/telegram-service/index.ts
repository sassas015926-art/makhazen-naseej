// ============================================================
// Edge Function: telegram-service
// خدمة مستقلة تمامًا عن email-service — خاصة فقط بتكامل Telegram Bot.
// صفر تعديل على أي كود Resend/Email حالي.
//
// يدعم 4 عمليات (action في الـ body):
//   - "validate"    : {token}            → يتأكد إن الـ Bot Token شغال فعليًا
//   - "sendTest"     : {token, chatId}    → يبعت رسالة اختبار حقيقية
//   - "getChatId"    : {token}            → يجيب آخر Chat ID اتكلم مع البوت
//   - "sendAlert"    : {token, chatId, text} → يبعت أي نص جاهز (تنبيهات المخزون)
//
// محمي بنفس أسلوب الحماية المستخدم في email-service و manage-users بالظبط:
// لازم يكون الطالب مسجل دخول ودوره "admin".
//
// النشر (مرة واحدة):
//   supabase functions deploy telegram-service
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const callerToken = authHeader.replace("Bearer ", "");
    if (!callerToken) return json({ error: "غير مصرح — سجّل دخولك تاني" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: callerData, error: callerErr } = await admin.auth.getUser(callerToken);
    if (callerErr || !callerData?.user) return json({ error: "الجلسة غير صالحة — سجّل دخولك تاني" }, 401);

    const { data: callerProfile } = await admin.from("profiles").select("role, is_active").eq("id", callerData.user.id).single();
    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.is_active === false) {
      return json({ error: "الصلاحية دي لمدير النظام فقط" }, 403);
    }

    const body = await req.json();
    const { action, token } = body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return json({ error: "Bot Token فاضي" }, 400);
    }

    if (action === "validate") {
      const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const rb = await r.json().catch(() => ({}));
      if (!rb.ok) {
        return json({ valid: false, reason: rb.description || "مفتاح Telegram Bot غير صحيح" });
      }
      return json({ valid: true, botUsername: rb.result?.username || null });
    }

    if (action === "sendTest") {
      const { chatId } = body;
      if (!chatId) return json({ success: false, reason: "Chat ID فاضي" });
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: "✅ رسالة اختبار من نظام إدارة المخازن Masnaei ERP" }),
      });
      const rb = await r.json().catch(() => ({}));
      if (!rb.ok) {
        // Telegram بيرجع رسائل خطأ واضحة زي "chat not found" أو "bot was blocked by the user"
        let reason = rb.description || "فشل الإرسال";
        if (/chat not found/i.test(reason)) reason = "Chat ID غير صحيح — تأكد إنك بدأت محادثة مع البوت الأول";
        if (/unauthorized/i.test(reason)) reason = "Bot Token غير صحيح";
        return json({ success: false, reason });
      }
      return json({ success: true });
    }

    if (action === "getChatId") {
      const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=5`);
      const rb = await r.json().catch(() => ({}));
      if (!rb.ok) return json({ found: false, reason: rb.description || "Bot Token غير صحيح" });
      const updates = rb.result || [];
      const last = updates.reverse().find((u: any) => u.message?.chat?.id);
      if (!last) return json({ found: false, reason: "لم يتم العثور على Chat ID. أرسل رسالة للبوت أولاً ثم حاول مرة أخرى." });
      return json({ found: true, chatId: String(last.message.chat.id), chatTitle: last.message.chat.first_name || last.message.chat.title || null });
    }

     {if (action === "sendAlert")
      const { chatId, text } = body;
      if (!chatId || !text) return json({ success: false, reason: "بيانات ناقصة" });
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      const rb = await r.json().catch(() => ({}));
      if (!rb.ok) return json({ success: false, reason: rb.description || "فشل الإرسال" });
      return json({ success: true });
    }

    return json({ error: "عملية غير معروفة" }, 400);
  } catch (e) {
    return json({ error: "حدث خطأ غير متوقع في الخادم — " + (e?.message || "") }, 500);
  }
});
