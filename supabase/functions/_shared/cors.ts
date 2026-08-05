// ============================================================
// ملف مشترك: رؤوس CORS + دالة موحّدة لبناء ردود JSON
// يُستخدم من كل فنكشنات نظام تيليجرام الجديد (منع تكرار نفس الكود)
// ============================================================

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
