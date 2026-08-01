-- ============================================================
-- ملف ترحيل إضافي — دعم تعديل بيانات المستخدمين وإعادة تعيين كلمة المرور
-- شغّله في Supabase SQL Editor (آمن تمامًا، إضافة أعمدة فقط، لن يفقدك أي بيانات)
-- بعد التشغيل، لازم تنشر (أو تعيد نشر) الدالة manage-users المحدّثة
-- (راجع ملف edge-function-manage-users.ts المرفق مع المشروع)
-- ============================================================

-- عمود لتخزين "اسم المستخدم" (نفس اللي بيدخل بيه تسجيل الدخول) عشان يظهر ويتعدل من شاشة إدارة المستخدمين
alter table profiles add column if not exists username text;

-- عمود لإجبار المستخدم على تغيير كلمة المرور أول ما يدخل، بعد ما المدير يعمله Reset Password
alter table profiles add column if not exists must_change_password boolean default false;

-- تعبئة عمود username للحسابات الموجودة بالفعل من الإيميل الحالي في auth.users
-- (شغّلها مرة واحدة، آمنة للتكرار)
update public.profiles p
set username = split_part(u.email, '@', 1)
from auth.users u
where p.id = u.id and (p.username is null or p.username = '');
