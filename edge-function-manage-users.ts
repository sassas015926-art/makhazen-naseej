// ============================================================
// Edge Function: manage-users
// ⚠️ ملف للمراجعة قبل النشر — راجعه كويس قبل ما تستبدل بيه نسخة supabase/functions/manage-users/index.ts
// اللي عندك بالفعل، لأني معنديش نسخة من الكود الأصلي اللي كنت ناشره قبل كده.
//
// بيدعم 4 عمليات (يبعتلها الفرونت إند action مختلف في نفس الـ body):
//   - "create"          : إنشاء حساب مستخدم جديد (اسم مستخدم + كلمة مرور + الاسم + الدور)
//   - "delete"           : حذف حساب نهائيًا
//   - "resetPassword"    : توليد كلمة مرور مؤقتة جديدة لمستخدم (يستخدمها المدير)
//   - "updateUsername"   : تغيير اسم المستخدم (بريد الدخول الداخلي) لحساب موجود
//
// كل العمليات محمية: لازم يكون اللي بيطلبها مسجل دخول (توكن صالح) ودوره "admin" في جدول profiles.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const USERNAME_SUFFIX = "@warsha.local"; // لازم يكون نفس القيمة الموجودة في config.js بالظبط

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function randomTempPassword() {
  // كلمة مرور مؤقتة سهلة القراءة والنطق بالتليفون: كلمتين + رقمين (مثال: "safa-nile42")
  const words = ["nile", "cairo", "warsha", "atlas", "amber", "cedar", "delta", "falcon", "lotus", "marble"];
  const w = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(10 + Math.random() * 89);
  return `${w}-${w2}${n}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const callerToken = authHeader.replace("Bearer ", "");
    if (!callerToken) return json({ error: "غير مصرح — سجّل دخولك تاني" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // تأكيد هوية اللي طالب العملية، والتأكد إنه "admin" فعليًا (من جدول profiles، مش من كلام الفرونت إند)
    const { data: callerData, error: callerErr } = await admin.auth.getUser(callerToken);
    if (callerErr || !callerData?.user) return json({ error: "الجلسة غير صالحة — سجّل دخولك تاني" }, 401);

    const { data: callerProfile } = await admin.from("profiles").select("role, is_active").eq("id", callerData.user.id).single();
    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.is_active === false) {
      return json({ error: "الصلاحية دي لمدير النظام فقط" }, 403);
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { email, password, fullName, role } = body;
      if (!email || !password) return json({ error: "بيانات ناقصة" }, 400);
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) return json({ error: error.message }, 400);
      const userId = data.user.id;
      // صف الـ profile بيتعمل تلقائيًا من الـ trigger (migration_phase1.sql)، هنا بنظبط الاسم والدور
      await admin.from("profiles").update({ full_name: fullName || null, role: role || "keeper" }).eq("id", userId);
      return json({ userId });
    }

    if (action === "delete") {
      const { userId } = body;
      if (!userId) return json({ error: "بيانات ناقصة" }, 400);
      if (userId === callerData.user.id) return json({ error: "متقدرش تحذف حسابك الشخصي" }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "resetPassword") {
      const { userId } = body;
      if (!userId) return json({ error: "بيانات ناقصة" }, 400);
      const tempPassword = randomTempPassword();
      const { error } = await admin.auth.admin.updateUserById(userId, { password: tempPassword });
      if (error) return json({ error: error.message }, 400);
      await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);
      return json({ tempPassword });
    }

    if (action === "updateUsername") {
      const { userId, newUsername } = body;
      if (!userId || !newUsername || !/^[a-z0-9._-]+$/.test(newUsername)) return json({ error: "اسم مستخدم غير صالح" }, 400);
      const newEmail = newUsername + USERNAME_SUFFIX;
      const { error } = await admin.auth.admin.updateUserById(userId, { email: newEmail, email_confirm: true });
      if (error) {
        if (String(error.message || "").toLowerCase().includes("already")) return json({ error: "اسم المستخدم ده مستخدم بالفعل" }, 400);
        return json({ error: error.message }, 400);
      }
      await admin.from("profiles").update({ username: newUsername }).eq("id", userId);
      return json({ ok: true });
    }

    return json({ error: "عملية غير معروفة" }, 400);
  } catch (e) {
    return json({ error: "حدث خطأ غير متوقع في الخادم — " + (e?.message || "") }, 500);
  }
});
