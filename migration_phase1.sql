-- ============================================================
-- ملف الترحيل — المرحلة الأولى
-- إدارة المستخدمين والصلاحيات + سجل العمليات + أكواد الأصناف والباركود
-- + إعدادات إضافية (الحد الأدنى للتنبيه، بيانات المصنع)
--
-- آمن للتشغيل على قاعدة بيانات موجودة بالفعل (كل الأوامر idempotent):
-- انسخ الملف كامل والصقه في Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- ---------- 1) تحديث جدول profiles: الأدوار وحالة التفعيل ----------
alter table profiles add column if not exists role text default 'keeper' check (role in ('admin','keeper','viewer'));
alter table profiles add column if not exists is_active boolean default true;
alter table profiles add column if not exists last_login timestamptz;
alter table profiles add column if not exists last_login_device text;

-- إنشاء صف تلقائي في profiles لأي حساب دخول جديد يُنشأ من Supabase
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, is_active)
  values (new.id, split_part(new.email, '@', 1), 'keeper', true)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- إنشاء صفوف profiles لأي حسابات موجودة بالفعل من قبل (قبل تفعيل الـ trigger)
insert into public.profiles (id, full_name, role, is_active)
select id, split_part(email, '@', 1), 'keeper', true from auth.users
on conflict (id) do nothing;

-- ---------- 2) دوال مساعدة للصلاحيات (تُستخدم في سياسات الحماية) ----------
create or replace function public.is_active_user()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active = true);
$$ language sql security definer stable;

create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active = true);
$$ language sql security definer stable;

create or replace function public.can_edit()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','keeper') and is_active = true);
$$ language sql security definer stable;

-- ---------- 3) أكواد الأصناف والباركود ----------
alter table items add column if not exists code text;
alter table items add column if not exists barcode text;
create unique index if not exists items_code_unique on items(code) where code is not null;

-- ---------- 4) إعدادات إضافية: الحد الأدنى للتنبيه وبيانات المصنع ----------
alter table settings add column if not exists alert_threshold_percent int default 15;
alter table settings add column if not exists warning_threshold_percent int default 30;
alter table settings add column if not exists address text;
alter table settings add column if not exists phone text;

-- ---------- 5) سجل العمليات الكامل (Audit Log) ----------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  action text not null,          -- مثال: صرف / إدخال / إضافة صنف / تعديل صنف / حذف صنف / تسجيل دخول / تغيير دور مستخدم
  entity text,                   -- مثال: item / user / settings / category
  entity_name text,              -- اسم الصنف أو المستخدم المعني
  qty_before numeric,
  qty_after numeric,
  device text,                   -- بيانات المتصفح/الجهاز
  details text,
  created_at timestamptz default now()
);
alter table audit_log enable row level security;
drop policy if exists "audit_read" on audit_log;
create policy "audit_read" on audit_log for select using (is_active_user());
drop policy if exists "audit_insert" on audit_log;
create policy "audit_insert" on audit_log for insert with check (is_active_user());

-- ---------- 6) تحديث سياسات الحماية (RLS) لتفعيل الأدوار وحالة الإيقاف ----------
-- settings
drop policy if exists "settings_public_read" on settings;
create policy "settings_public_read" on settings for select using (true);
drop policy if exists "settings_auth_update" on settings;
create policy "settings_admin_update" on settings for update using (is_admin());

-- categories
drop policy if exists "categories_read" on categories;
create policy "categories_read" on categories for select using (is_active_user());
drop policy if exists "categories_insert" on categories;
create policy "categories_insert" on categories for insert with check (can_edit());
drop policy if exists "categories_delete" on categories;
create policy "categories_delete" on categories for delete using (can_edit());

-- items
drop policy if exists "items_read" on items;
create policy "items_read" on items for select using (is_active_user());
drop policy if exists "items_insert" on items;
create policy "items_insert" on items for insert with check (can_edit());
drop policy if exists "items_update" on items;
create policy "items_update" on items for update using (can_edit());
drop policy if exists "items_delete" on items;
create policy "items_delete" on items for delete using (can_edit());

-- transactions (الإدخال والصرف) — الموظف "قراءة فقط" ميقدرش يسجّل حركة
drop policy if exists "tx_read" on transactions;
create policy "tx_read" on transactions for select using (is_active_user());
drop policy if exists "tx_insert" on transactions;
create policy "tx_insert" on transactions for insert with check (can_edit());

-- profiles — القراءة لأي مستخدم نشط
drop policy if exists "profiles_read" on profiles;
create policy "profiles_read" on profiles for select using (is_active_user());
drop policy if exists "profiles_upsert" on profiles;
drop policy if exists "profiles_update" on profiles;
drop policy if exists "profiles_admin_update" on profiles;
drop policy if exists "profiles_self_update_name" on profiles;

-- سياسة واحدة: المستخدم يقدر يحدّث صف نفسه (مثلاً وقت تسجيل الدخول)، أو المدير يقدر يحدّث أي صف
create policy "profiles_update" on profiles for update using (auth.uid() = id or is_admin());

-- **مهم جدًا**: بدون الترغر ده، أي مستخدم عادي كان يقدر بنداء مباشر لواجهة Supabase (خارج التطبيق)
-- يغيّر دوره الخاص لـ admin أو يفعّل حسابه بنفسه لو تم إيقافه. الترغر ده يمنع ده تمامًا:
-- عمود role وis_active ميتغيّروش إلا لو اللي بيعمل التعديل هو admin فعلاً، أيًا كانت السياسة اللي سمحت بالتحديث.
create or replace function public.protect_profile_privileges()
returns trigger as $$
begin
  -- auth.uid() فاضي معناها التحديث جاي من SQL Editor أو service_role مباشرة (صاحب المشروع) — نسمح بيه.
  -- لو فيه مستخدم مسجل دخول من التطبيق (auth.uid() موجود) ومش admin، امنع تغيير الدور أو حالة التفعيل.
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_profile_privileges_trg on profiles;
create trigger protect_profile_privileges_trg
  before update on profiles
  for each row execute function public.protect_profile_privileges();

-- ============================================================
-- خطوة أخيرة **لازم تعملها يدويًا مرة واحدة**:
-- خلي أول حساب بتاعك "مدير النظام" (admin) بدل الدور الافتراضي "أمين مخزن"
-- غيّر البريد بالإيميل بتاع حسابك (username + @warsha.local أو اللاحقة اللي مستخدمها)
-- ============================================================
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'admin@warsha.local');
