// ============================================================
// قالب HTML موحّد واحترافي لكل رسائل البريد في النظام
// (تنبيهات المخزون الحرج/المنخفض، البريد الاختباري، التقرير اليومي)
//
// الهدف: كل رسالة تخرج من النظام تبان بنفس الهوية البصرية — هيدر بشعار
// "Masnaei ERP" وشريط لون علوي، كارت أبيض بحواف مدوّرة وظل خفيف، زر واضح
// لفتح النظام، وفوتر موحّد فيه اسم النظام والإصدار ورابط الموقع.
//
// الاستخدام: كل فنكشن بيبني بس محتوى الجسم (bodyHtml) الخاص برسالته، وينده
// wrapEmail() حواليه — القالب نفسه (الهيدر/الفوتر/الزر) واحد موحّد ومركزي.
// ============================================================

export const APP_VERSION = "1.0";
export const DEFAULT_APP_URL = "https://masnaei-erp.vercel.app";

export function wrapEmail(opts: {
  title: string;
  bodyHtml: string;
  accentColor?: string;
  appUrl?: string;
  ctaLabel?: string;
}) {
  const accent = opts.accentColor || "#17899F";
  const appUrl = opts.appUrl || DEFAULT_APP_URL;
  const appUrlDisplay = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const ctaLabel = opts.ctaLabel || "فتح النظام الآن";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0; padding:0; background:#F1F4F8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F4F8; padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 2px 10px rgba(18,42,74,0.07); font-family:Tahoma, Arial, sans-serif;">
        <tr><td style="height:5px; background:linear-gradient(90deg,#17899F,#1AA34A); font-size:0; line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:26px 28px 14px; text-align:center;">
          <span style="display:inline-block; background:#122A4A; color:#ffffff; font-weight:800; font-size:14.5px; padding:8px 18px; border-radius:8px; letter-spacing:.3px;">Masnaei&nbsp;ERP</span>
          <div style="margin-top:10px; font-size:11.5px; color:#8A94A6;">نظام إدارة المخازن</div>
        </td></tr>
        <tr><td style="padding:0 28px 18px; text-align:center; border-bottom:1px solid #EEF1F5;">
          <h1 style="margin:0; font-size:19px; color:#122A4A;">${opts.title}</h1>
        </td></tr>
        <tr><td style="padding:24px 28px; color:#122A4A; font-size:14px; line-height:1.9;">
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:4px 28px 28px; text-align:center;">
          <a href="${appUrl}" style="display:inline-block; background:${accent}; color:#ffffff; text-decoration:none; font-weight:700; font-size:13.5px; padding:12px 30px; border-radius:10px;">${ctaLabel}</a>
        </td></tr>
        <tr><td style="padding:16px 28px; background:#F7F9FB; text-align:center; font-size:11px; color:#9AA5B5; line-height:1.9;">
          Masnaei ERP — نظام إدارة المخازن · الإصدار ${APP_VERSION}<br>
          <a href="${appUrl}" style="color:${accent}; text-decoration:none;">${appUrlDisplay}</a><br>
          تم الإرسال تلقائيًا — من فضلك لا تُرسل ردًا على هذا البريد
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
