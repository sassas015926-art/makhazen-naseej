// ============================================================
// Edge Function: email-service
// خدمة منفصلة تمامًا عن manage-users — خاصة فقط بالتحقق من مفتاح Resend
// وإرسال بريد اختباري حقيقي. لا تلمس أي جدول أو منطق تاني في المشروع.
//
// يدعم عمليتين (action في الـ body):
//   - "validate"  : {apiKey}      → يتحقق إن المفتاح شغال فعليًا مع Resend
//   - "sendTest"  : {apiKey, to}  → يبعت إيميل اختباري حقيقي
//
// محمي بالكامل: لازم يكون الطالب مسجل دخول ودوره "admin" في جدول profiles
// (نفس أسلوب الحماية المستخدم في manage-users بالظبط).
//
// النشر (مرة واحدة):
//   supabase functions deploy email-service
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// المرسل الافتراضي من Resend (شغال فورًا بدون أي إعداد نطاق).
// ⚠️ ملحوظة مهمة: العنوان ده بيقدر يبعت بس لإيميل صاحب حساب Resend نفسه
// طالما مفيش نطاق (domain) موثّق في حساب Resend. لو عايز تبعت لأي إيميل
// تاني (زي إيميلات العمال)، لازم توثّق نطاقك الخاص في Resend وتغيّر
// السطر ده لإيميل من نطاقك، مثال: "تنبيهات المخزن <alerts@yourdomain.com>"
const DEFAULT_FROM = "نظام إدارة المخازن <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const callerToken = authHeader.replace("Bearer ", "");

    if (!callerToken) {
      return json({ error: "غير مصرح — سجّل دخولك تاني" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerData, error: callerErr } =
      await admin.auth.getUser(callerToken);

    if (callerErr || !callerData?.user) {
      return json({ error: "الجلسة غير صالحة — سجّل دخولك تاني" }, 401);
    }

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role, is_active")
      .eq("id", callerData.user.id)
      .single();

    if (
      !callerProfile ||
      callerProfile.role !== "admin" ||
      callerProfile.is_active === false
    ) {
      return json({ error: "الصلاحية دي لمدير النظام فقط" }, 403);
    }

    const body = await req.json();
    const { action, apiKey } = body;

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return json({ error: "مفتاح Resend فاضي" }, 400);
    }

    if (!apiKey.startsWith("re_")) {
      const badFormatMsg =
        "شكل المفتاح غلط — مفاتيح Resend لازم تبدأ بـ re_";

      return json(
        action === "sendTest"
          ? { success: false, reason: badFormatMsg }
          : { valid: false, reason: badFormatMsg }
      );
    }
if (action === "validate") {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: DEFAULT_FROM,
      to: ["sassas015926@gmail.com"],
      subject: "اختبار صلاحية مفتاح Resend",
      html: "<p>تم التحقق من مفتاح Resend بنجاح</p>",
    }),
  });

  if (r.status === 401 || r.status === 403) {
    return json({
      valid: false,
      reason: "مفتاح Resend غير صحيح أو تم إلغاؤه",
    });
  }

  if (!r.ok) {
    const error = await r.text();
    return json({
      valid: false,
      reason: `فشل التحقق من Resend: ${error}`,
    });
  }

  return json({ valid: true });
}

    if (action === "sendTest") {
      const { to } = body;

      if (!to || typeof to !== "string") {
        return json({ error: "إيميل المستقبل ناقص" }, 400);
      }

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: DEFAULT_FROM,
          to: [to],
          subject: "بريد اختباري — نظام إدارة المخازن ✅",
          html: `
            <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;padding:20px;color:#122A4A;">
              <h2 style="margin:0 0 12px;">هذه رسالة اختبار ✅</h2>
              <p>لو وصلتك الرسالة دي، يبقى إعدادات إرسال الإيميلات في نظام إدارة المخازن شغالة صح.</p>
              <p style="color:#888;font-size:12px;margin-top:24px;">
                تم الإرسال في: ${new Date().toLocaleString("ar-EG")}
              </p>
            </div>
          `,
        }),
      });

      const respBody: any = await r.json().catch(() => ({}));
.message
      });
    }
    if (action === "sendLowStockAlert") {
      const { to, itemName, qty, maxQty, unit, pct } = body;

      if (!Array.isArray(to) || !to.length) {
        return json({ error: "إيميلات الاستقبال ناقصة" }, 400);
      }

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: DEFAULT_FROM,
          to,
          subject: `⚠️ تنبيه مخزون حرج — ${itemName}`,
          html: `
            <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;padding:20px;color:#122A4A;">
              <h2>⚠️ تنبيه مخزون حرج</h2>
              <p>وصل الصنف إلى المستوى الحرج.</p>

              <p><b>الصنف:</b> ${itemName}</p>
              <p><b>الكمية الحالية:</b> ${qty} ${unit}</p>
              <p><b>الحد الأقصى:</b> ${maxQty} ${unit}</p>
              <p><b>النسبة الحالية:</b> ${Number(pct).toFixed(1)}%</p>

              <p style="color:#888;font-size:12px;margin-top:20px;">
                نظام إدارة المخازن
              </p>
            </div>
          `,
        }),
      });

      const respBody: any = await r.json().catch(() => ({}));

      if (!r.ok) {
        return json({
          success: false,
          reason: respBody.message || `فشل الإرسال (كود ${r.status})`,
        });
      }

      return json({
        success: true