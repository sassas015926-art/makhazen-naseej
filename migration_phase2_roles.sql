-- ============================================================
-- ملف ترحيل إضافي — توسعة الأدوار من 3 لـ 7 أدوار
-- شغّله في Supabase SQL Editor بعد migration_phase1.sql
-- آمن للتشغيل أكتر من مرة
-- ============================================================

-- الأدوار الجديدة:
-- admin (مدير النظام) — كل الصلاحيات
-- factory_manager (مدير المصنع) — لوحة تحكم + مخزون + تقارير فقط (بدون إدخال/سحب)
-- keeper (أمين مخزن) — كل شيء تشغيلي (لوحة تحكم، مخزون، إدخال، سحب، تقارير) بدون مستخدمين/إعدادات
-- production_manager (مدير الإنتاج) — لوحة تحكم + عرض المخزون + تقارير
-- accountant (المحاسب) — عرض المخزون + التقارير فقط (بدون لوحة تحكم)
-- quality (مراقب الجودة) — عرض فقط للوحة التحكم والمخزون والتقارير
-- viewer (للقراءة فقط) — عرض فقط لكل شيء تشغيلي

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'factory_manager', 'keeper', 'production_manager', 'accountant', 'quality', 'viewer'));

-- ملاحظة: دوال is_admin() و can_edit() و is_active_user() الموجودة بالفعل
-- (من migration_phase1.sql) لسه شغالة صح مع الأدوار الجديدة، مفيش داعي نعدّلها:
-- - can_edit() (تسمح بالإدخال/السحب/تعديل الأصناف) لسه بتشتغل بس لـ admin و keeper، وده مطلوب بالظبط.
-- - is_admin() لسه بتشتغل بس لـ admin.
-- - باقي الأدوار (factory_manager, production_manager, accountant, quality, viewer) عندها قراءة فقط
--   على مستوى قاعدة البيانات تلقائيًا، والتحكم في أي صفحة تظهرلهم متحكم فيه من واجهة التطبيق.
