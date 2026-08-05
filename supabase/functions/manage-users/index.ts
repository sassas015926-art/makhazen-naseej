// ============================================================
// Edge Function: manage-users
// مسؤولة عن كل عمليات إدارة حسابات الدخول اللي محتاجة صلاحية
// service_role (لا يمكن تنفيذها من المتصفح مباشرة لأسباب أمنية):
//   - "create"          : {email, password, fullName, role} → إنشاء حساب جديد
//   - "delete"           : {userId}                          → حذف حساب نهائيًا
//   - "updateUsername"   : {userId, newUsername}              → تغيير اسم المستخدم (وبالتالي الإيميل الداخلي)
//   - "resetPassword"    : {userId, customPassword?}          → توليد كلمة مرور مؤقتة (أو استخدام
//                                                                 customPassword لو المدير حدد كلمة مرور
//                                                                 بنفسه بناءً على طلب المستخدم) + إجبار
//                                                                 تغييرها أول دخول في الحالتين
//
// محمي بالكامل: لازم يكون الطالب مسجل دخول ودوره "admin" في جدول profiles وحسابه مفعّل.
//
// النشر (مرة واحدة، أو بعد أي تعديل على هذا الملف):
//   supabase functions deploy manage-users
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

// كلمة مرور مؤقتة سهلة القراءة والنسخ (بدون حروف/أرقام ملتبسة زي 0/O أو 1/l)
function generateTempPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
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
    const { action } = body;

    // ---------------- إنشاء حساب جديد ----------------
    if (action === "create") {
      const { email, password, fullName, role } = body;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return json({ error: "الإيميل الداخلي غير صالح" }, 400);
      }
      if (!password || typeof password !== "string" || password.length < 6) {
        return json({ error: "كلمة المرور لازم تكون 6 أحرف على الأقل" }, 400);
      }

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        const msg = /already.*registered|duplicate/i.test(error.message || "")
          ? "اسم المستخدم ده مستخدم بالفعل"
          : error.message;
        return json({ error: msg }, 400);
      }

      const userId = created.user.id;

      // صف الـ profile ممكن يكون اتعمل تلقائيًا بتريجر على auth.users،
      // فبنستخدم upsert عشان يشتغل صح في الحالتين
      const { error: profErr } = await admin.from("profiles").upsert({
        id: userId,
        full_name: fullName || "",
        role: role || "viewer",
        is_active: true,
      });

      if (profErr) {
        return json({ error: profErr.message }, 400);
      }

      return json({ userId });
    }

    // ---------------- حذف حساب نهائيًا ----------------
    if (action === "delete") {
      const { userId } = body;

      if (!userId || typeof userId !== "string") {
        return json({ error: "معرف المستخدم ناقص" }, 400);
      }
      if (userId === callerData.user.id) {
        return json({ error: "لا يمكنك حذف حسابك الشخصي" }, 400);
      }

      const { error } = await admin.auth.admin.deleteUser(userId);

      if (error) {
        return json({ error: error.message }, 400);
      }

      return json({ success: true });
    }

    // ---------------- تعديل اسم المستخدم ----------------
    if (action === "updateUsername") {
      const { userId, newUsername } = body;

      if (!userId || !newUsername || typeof newUsername !== "string") {
        return json({ error: "البيانات ناقصة" }, 400);
      }
      if (!/^[a-z0-9._-]+$/.test(newUsername)) {
        return json(
          { error: "اسم المستخدم لازم يكون بالإنجليزي بدون مسافات" },
          400
        );
      }

      const { data: targetUser, error: getErr } =
        await admin.auth.admin.getUserById(userId);

      if (getErr || !targetUser?.user) {
        return json({ error: "تعذر إيجاد هذا المستخدم" }, 400);
      }

      const currentEmail = targetUser.user.email || "";
      const atIndex = currentEmail.indexOf("@");
      const domainSuffix = atIndex >= 0 ? currentEmail.slice(atIndex) : "@warsha.local";
      const newEmail = newUsername + domainSuffix;

      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        email: newEmail,
      });

      if (updErr) {
        const msg = /already.*registered|duplicate/i.test(updErr.message || "")
          ? "اسم المستخدم ده مستخدم بالفعل"
          : updErr.message;
        return json({ error: msg }, 400);
      }

      const { error: profErr } = await admin
        .from("profiles")
        .update({ username: newUsername })
        .eq("id", userId);

      if (profErr) {
        return json({ error: profErr.message }, 400);
      }

      return json({ success: true });
    }

    // ---------------- إعادة تعيين كلمة مرور (تلقائية أو يحددها المدير) ----------------
    if (action === "resetPassword") {
      const { userId, customPassword } = body;

      if (!userId || typeof userId !== "string") {
        return json({ error: "معرف المستخدم ناقص" }, 400);
      }

      // لو المدير حدد كلمة مرور بنفسه (اللي المستخدم طلبها)، نستخدمها بعد التحقق من طولها.
      // غير كده، نولّد كلمة مرور مؤقتة عشوائية زي ما كان شغال.
      let tempPassword = generateTempPassword();
      if (customPassword !== undefined && customPassword !== null && customPassword !== "") {
        if (typeof customPassword !== "string" || customPassword.length < 6) {
          return json({ error: "كلمة المرور لازم تكون 6 أحرف على الأقل" }, 400);
        }
        tempPassword = customPassword;
      }

      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });

      if (error) {
        return json({ error: error.message }, 400);
      }

      const { error: profErr } = await admin
        .from("profiles")
        .update({ must_change_password: true })
        .eq("id", userId);

      if (profErr) {
        return json({ error: profErr.message }, 400);
      }

      return json({ tempPassword });
    }

    return json({ error: "عملية غير معروفة" }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json(
      { error: "حدث خطأ غير متوقع في الخادم — " + message },
      500
    );
  }
});
