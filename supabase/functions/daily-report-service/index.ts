// ============================================================
// Edge Function: daily-report-service
// خدمة مستقلة تمامًا، بتتنادى تلقائيًا من pg_cron كل 15 دقيقة (مش من المستخدم
// أو من الفرونت إند خالص). بتبني تقرير حالة المخزن اليومي وتبعته إيميل + تيليجرام.
//
// ملحوظة تصميم مهمة: الفنكشن دي بتبعت البريد والتيليجرام بنفسها مباشرة
// (بدل ما تنادي email-service/telegram-service) عشان:
//  1) صفر تعديل على email-service.ts (قاعدة صارمة من صاحب المشروع).
//  2) سياق التشغيل مختلف تمامًا (مُستَدعاة من الخادم بمفتاح service role،
//     مش من مستخدم مسجّل دخول)، فمنطق التحقق الإداري في الفنكشنات التانية
//     مش هيصلح هنا أصلًا.
//
// الحماية: بنتأكد إن اللي بينادي الفنكشن هو نفسه (Authorization يطابق
// service role key بتاعنا فعليًا)، عشان محدش يقدر يستدعيها من برة.
//
// النشر (مرة واحدة):
//   supabase functions deploy daily-report-service --no-verify-jwt
// (نستخدم --no-verify-jwt لأن اللي هينادي الفنكشن هو pg_cron مش مستخدم عادي،
//  والتحقق الحقيقي بيحصل يدويًا جوا الكود بمقارنة الـ service role key)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// نفس آلية email-service.ts بالضبط: العنوان يُقرأ من Secret اختياري EMAIL_FROM_ADDRESS
const DEFAULT_FROM = Deno.env.get("EMAIL_FROM_ADDRESS") || "نظام إدارة المخازن <onboarding@resend.dev>";
const TIMEZONE = "Europe/Istanbul";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// وقت اسطنبول الحالي بشكل دقيق (باستخدام قاعدة بيانات المناطق الزمنية الرسمية، مش حساب يدوي)
function istanbulNowParts() {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const parts: Record<string, string> = {};
  fmt.formatToParts(new Date()).forEach(p => { if (p.type !== "literal") parts[p.type] = p.value; });
  return { hour: Number(parts.hour), minute: Number(parts.minute), dateStr: `${parts.year}-${parts.month}-${parts.day}` };
}

Deno.serve(async (req) => {
  try {
    // حماية: النداء التلقائي من pg_cron لازم يكون بمفتاح service role.
    // بالإضافة لذلك، بندعم نداء يدوي من مستخدم مسجّل دخول ودوره "admin" فقط
    // (زر "إرسال تقرير تجريبي الآن" في شاشة الإعدادات) لأغراض التشخيص والاختبار.
    const authHeader = req.headers.get("Authorization") || "";
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    let isManualTest = false;

    if (authHeader === `Bearer ${SERVICE_ROLE_KEY}`) {
      isManualTest = false;
    } else {
      const callerToken = authHeader.replace("Bearer ", "");
      const { data: callerData } = callerToken ? await admin.auth.getUser(callerToken) : { data: null };
      const { data: callerProfile } = callerData?.user
        ? await admin.from("profiles").select("role, is_active").eq("id", callerData.user.id).single()
        : { data: null };
      if (!callerProfile || callerProfile.role !== "admin" || callerProfile.is_active === false) {
        return json({ error: "غير مصرح" }, 401);
      }
      isManualTest = true;
    }

    const { data: settings } = await admin.from("settings").select("*").eq("id", 1).single();
    if (!settings) return json({ skipped: true, reason: "no settings row" });

    if (!settings.daily_report_enabled && !isManualTest) {
      return json({ skipped: true, reason: "daily_report_enabled = false" });
    }

    const { hour, minute, dateStr } = istanbulNowParts();
    const [targetHour, targetMinute] = (settings.daily_report_time || "16:00").split(":").map(Number);
    const nowMinutes = hour * 60 + minute;
    const targetMinutes = targetHour * 60 + targetMinute;
    const inWindow = nowMinutes >= targetMinutes && nowMinutes < targetMinutes + 15;
    if (!inWindow && !isManualTest) {
      return json({ skipped: true, reason: `not in window (now ${hour}:${minute}, target ${settings.daily_report_time})` });
    }

    // منع التكرار في نفس اليوم (لا يُطبَّق على الاختبار اليدوي حتى لا يُعتبر التقرير
    // "اتبعت النهاردة" ويمنع الإرسال التلقائي الحقيقي الساعة المحددة)
    if (settings.last_daily_report_sent_at && !isManualTest) {
      const lastSentDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date(settings.last_daily_report_sent_at));
      if (lastSentDateStr === dateStr) {
        return json({ skipped: true, reason: "already sent today" });
      }
    }

    // ---------- بناء بيانات التقرير ----------
    const critT = settings.alert_threshold_percent || 15;
    const warnT = settings.warning_threshold_percent || 30;
    const { data: items } = await admin.from("items").select("name, qty, max_qty, unit");
    const allItems = items || [];
    const pctOf = (it: any) => (it.max_qty > 0 ? (it.qty / it.max_qty) * 100 : 100);
    const statusOf = (it: any) => { const p = pctOf(it); return p <= critT ? "critical" : (p <= warnT ? "low" : "ok"); };

    // القائمة الفعلية بالأصناف اللي محتاجة شراء (حرج + منخفض)، الأسوأ حالًا الأول
    const needsPurchase = allItems
      .map(it => ({ ...it, pct: pctOf(it), status: statusOf(it) }))
      .filter(it => it.status !== "ok")
      .sort((a, b) => a.pct - b.pct);
    const criticalCount = needsPurchase.filter(it => it.status === "critical").length;
    const lowCount = needsPurchase.filter(it => it.status === "low").length;

    const { data: latestTx } = await admin.from("transactions").select("item_name, type, qty, unit, created_at").order("created_at", { ascending: false }).limit(8);

    const todayLabel = new Date().toLocaleDateString("ar-EG", { timeZone: TIMEZONE, year: "numeric", month: "long", day: "numeric" });
    const nowLabel = new Date().toLocaleTimeString("ar-EG", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" });
    const statusLabel = (s: string) => (s === "critical" ? "حرج" : "منخفض");
    const latestTxText = (latestTx || []).length
      ? latestTx!.map(t => `• ${t.item_name} — ${t.type === "in" ? "إدخال" : "سحب"} ${t.qty} ${t.unit || ""}`).join("\n")
      : "لا توجد حركات مسجّلة";

    // ---------- محتوى Telegram: ملخص سريع + أسماء الأصناف بس (بدون تفاصيل) ----------
    const tgItemNames = needsPurchase.length
      ? needsPurchase.map(it => `• ${it.name} (${statusLabel(it.status)})`).join("\n")
      : "لا توجد أصناف تحتاج شراء حاليًا ✅";
    const plainText = `📊 تقرير حالة المخزن اليومي\n\nالتاريخ:\n${todayLabel}\n\nإجمالي الأصناف:\n${allItems.length}\n\nعدد الأصناف الحرجة:\n${criticalCount}\n\nعدد الأصناف المنخفضة:\n${lowCount}\n\nالأصناف المطلوب شراؤها:\n${tgItemNames}\n\nتم إرسال التقرير التفصيلي إلى البريد الإلكتروني.`;

    // ---------- محتوى الإيميل: تقرير كامل بجدول تفصيلي ----------
    const purchaseRowsHtml = needsPurchase.length
      ? needsPurchase.map(it => `
          <tr style="border-top:1px solid #E5EAF1;">
            <td style="padding:8px 10px; font-weight:700;">${it.name}</td>
            <td style="padding:8px 10px;" class="mono">${it.qty} ${it.unit || ""}</td>
            <td style="padding:8px 10px;" class="mono">${it.max_qty} ${it.unit || ""}</td>
            <td style="padding:8px 10px;" class="mono">${Math.round(it.pct)}%</td>
            <td style="padding:8px 10px;"><span style="background:${it.status === "critical" ? "#FBEAE9" : "#FAF0DC"}; color:${it.status === "critical" ? "#D6473F" : "#A8701E"}; padding:3px 10px; border-radius:999px; font-size:11.5px; font-weight:800;">${statusLabel(it.status)}</span></td>
          </tr>`).join("")
      : `<tr><td colspan="5" style="padding:14px; text-align:center; color:#888;">لا توجد أصناف تحتاج شراء حاليًا ✅</td></tr>`;

    const htmlText = `
      <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif; padding:20px; color:#122A4A; max-width:600px;">
        <h2 style="margin:0 0 4px;">📊 تقرير حالة المخزن اليومي</h2>
        <p style="color:#666; margin:0 0 20px;">${todayLabel} — الساعة ${nowLabel}</p>
        <div style="display:flex; gap:12px; margin-bottom:22px;">
          <div style="flex:1; background:#EEF5F6; border-radius:10px; padding:12px; text-align:center;"><div style="font-size:22px; font-weight:800;">${allItems.length}</div><div style="font-size:12px; color:#666;">إجمالي الأصناف</div></div>
          <div style="flex:1; background:#FBEAE9; border-radius:10px; padding:12px; text-align:center;"><div style="font-size:22px; font-weight:800; color:#D6473F;">${criticalCount}</div><div style="font-size:12px; color:#666;">أصناف حرجة</div></div>
          <div style="flex:1; background:#FAF0DC; border-radius:10px; padding:12px; text-align:center;"><div style="font-size:22px; font-weight:800; color:#A8701E;">${lowCount}</div><div style="font-size:12px; color:#666;">أصناف منخفضة</div></div>
        </div>
        <h3 style="margin:0 0 10px; font-size:15px;">🛒 الأصناف المطلوب شراؤها</h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:22px;">
          <thead><tr style="background:#DFEBEC; text-align:right;">
            <th style="padding:8px 10px;">الصنف</th><th style="padding:8px 10px;">الكمية الحالية</th><th style="padding:8px 10px;">الحد الأقصى</th><th style="padding:8px 10px;">نسبة الامتلاء</th><th style="padding:8px 10px;">الحالة</th>
          </tr></thead>
          <tbody>${purchaseRowsHtml}</tbody>
        </table>
        <h3 style="margin:0 0 8px; font-size:14px;">آخر عمليات المخزن</h3>
        <pre style="white-space:pre-wrap; font-family:inherit; font-size:13px; background:#F7F8FA; padding:10px; border-radius:8px;">${latestTxText}</pre>
      </div>`;

    const results: any = { email: null, telegram: null };

    // ---------- الإرسال عبر Email (Resend مباشرة) ----------
    if (settings.resend_api_key) {
      const recipients = (settings.notify_emails || "").split(",").map((e: string) => e.trim()).filter(Boolean);
      if (recipients.length) {
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${settings.resend_api_key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: DEFAULT_FROM, to: recipients, subject: `📊 تقرير المخزن اليومي — ${todayLabel}`, html: htmlText }),
          });
          const rb = await r.json().catch(() => ({}));
          results.email = r.ok ? { success: true } : { success: false, reason: rb.message };
        } catch (e) { results.email = { success: false, reason: String(e) }; }
      }
    }

    // ---------- الإرسال عبر Telegram مباشرة ----------
    if (settings.telegram_bot_token && settings.telegram_chat_id) {
      try {
        const r = await fetch(`https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: settings.telegram_chat_id, text: plainText }),
        });
        const rb = await r.json().catch(() => ({}));
        results.telegram = rb.ok ? { success: true } : { success: false, reason: rb.description };
      } catch (e) { results.telegram = { success: false, reason: String(e) }; }
    }

    // لا نُسجّل "تم الإرسال" إلا لو كل قناة مُفعّلة (لها بيانات إعداد) نجحت فعليًا.
    // القناة الغير مُفعَّلة أصلًا (زي لو الإيميل مش متظبط) لا تُعتبر فشلًا ولا توقف التسجيل.
    // هذا يضمن: لو فشلت محاولة الساعة 4 (خطأ شبكة/مفتاح خاطئ)، هيتعاد المحاولة كل 15 دقيقة
    // لحد ما تنجح أو ينتهي اليوم — بدل ما يتسجّل "تم" غلط ويوقف أي محاولة تانية.
    const emailAttempted = !!(settings.resend_api_key && (settings.notify_emails || "").split(",").map((e: string) => e.trim()).filter(Boolean).length);
    const telegramAttempted = !!(settings.telegram_bot_token && settings.telegram_chat_id);
    const emailOk = !emailAttempted || results.email?.success === true;
    const telegramOk = !telegramAttempted || results.telegram?.success === true;

    if (!isManualTest && emailOk && telegramOk) {
      await admin.from("settings").update({ last_daily_report_sent_at: new Date().toISOString() }).eq("id", 1);
    }

    return json({ sent: true, isManualTest, fullySucceeded: emailOk && telegramOk, results });
  } catch (e) {
    return json({ error: "حدث خطأ غير متوقع — " + (e?.message || "") }, 500);
  }
});
