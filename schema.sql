-- ============================================================
-- نظام إدارة مخزون الورشة — إعداد قاعدة البيانات على Supabase
-- انسخ هذا الملف كاملاً والصقه في: Supabase Dashboard > SQL Editor > New query
-- ثم اضغط Run
-- ============================================================

-- جدول بيانات الورشة (الاسم + الشعار)
create table if not exists settings (
  id int primary key default 1,
  workshop_name text default 'مصنع نسيج',
  logo_base64 text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into settings (id, workshop_name) values (1, 'مصنع نسيج')
on conflict (id) do nothing;

-- جدول أنواع المنتجات (الفئات) — يضاف يدويًا من التطبيق
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);
insert into categories (name) values
  ('أقمشة'), ('خيوط'), ('أزرار وسحابات'), ('بطانات'), ('إكسسوارات'), ('أخرى')
on conflict (name) do nothing;

-- جدول الأصناف (المخزون)
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text default 'قطعة',
  qty numeric not null default 0,
  max_qty numeric not null default 100,
  created_at timestamptz default now()
);

-- جدول الحركات (إدخال / سحب)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete set null,
  item_name text,
  unit text,
  type text check (type in ('in','out')),
  qty numeric not null,
  worker text,
  note text,
  created_at timestamptz default now()
);

-- بيانات إضافية للعامل (اسمه الكامل)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

-- ============================================================
-- تفعيل الحماية على مستوى الصفوف (RLS)
-- القاعدة: القراءة/الكتابة مسموحة فقط للمستخدمين المسجّلين دخول
-- بيانات الورشة (الاسم والشعار) قراءتها متاحة للجميع لعرضها في شاشة الدخول
-- ============================================================
alter table settings enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table transactions enable row level security;
alter table profiles enable row level security;

-- settings: قراءة عامة، تعديل للمسجلين فقط
create policy "settings_public_read" on settings for select using (true);
create policy "settings_auth_update" on settings for update using (auth.role() = 'authenticated');

-- categories
create policy "categories_read" on categories for select using (auth.role() = 'authenticated');
create policy "categories_insert" on categories for insert with check (auth.role() = 'authenticated');
create policy "categories_delete" on categories for delete using (auth.role() = 'authenticated');

-- items
create policy "items_read" on items for select using (auth.role() = 'authenticated');
create policy "items_insert" on items for insert with check (auth.role() = 'authenticated');
create policy "items_update" on items for update using (auth.role() = 'authenticated');
create policy "items_delete" on items for delete using (auth.role() = 'authenticated');

-- transactions
create policy "tx_read" on transactions for select using (auth.role() = 'authenticated');
create policy "tx_insert" on transactions for insert with check (auth.role() = 'authenticated');

-- profiles
create policy "profiles_read" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_upsert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- ============================================================
-- (اختياري) بيانات تجريبية لتجربة التطبيق أول مرة
-- ============================================================
insert into items (name, category, unit, qty, max_qty) values
  ('قماش قطن أبيض', 'أقمشة', 'متر', 42, 200),
  ('قماش جينز أزرق', 'أقمشة', 'متر', 15, 150),
  ('خيط بوليستر أسود', 'خيوط', 'بكرة', 8, 100),
  ('أزرار بلاستيك 4 ثقوب', 'أزرار وسحابات', 'قطعة', 320, 2000),
  ('سحاب معدني 20 سم', 'أزرار وسحابات', 'قطعة', 12, 300)
on conflict do nothing;
