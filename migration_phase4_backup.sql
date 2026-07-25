-- ============================================================
-- ملف ترحيل — المرحلة الرابعة: النسخ الاحتياطي
-- شغّله في Supabase SQL Editor بعد الملفات السابقة
-- آمن للتشغيل أكتر من مرة
-- ============================================================

create extension if not exists pg_cron;

-- جدول النسخ الاحتياطية
create table if not exists backups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by text,
  data jsonb not null
);
alter table backups enable row level security;
drop policy if exists "backups_read" on backups;
create policy "backups_read" on backups for select using (is_admin());
drop policy if exists "backups_insert" on backups;
create policy "backups_insert" on backups for insert with check (is_admin());

-- دالة إنشاء نسخة احتياطية (يدويًا أو تلقائيًا)
create or replace function public.create_backup(actor text default 'نظام تلقائي')
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
  snapshot jsonb;
begin
  select jsonb_build_object(
    'items', (select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) from items i),
    'categories', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from categories c),
    'settings', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from settings s),
    'transactions_count', (select count(*) from transactions)
  ) into snapshot;

  insert into backups (created_by, data) values (actor, snapshot) returning id into new_id;

  -- الاحتفاظ بآخر 30 نسخة فقط لتوفير المساحة
  delete from backups where id not in (
    select id from backups order by created_at desc limit 30
  );

  return new_id;
end;
$$;
grant execute on function public.create_backup(text) to authenticated;

-- دالة الاستعادة (الأصناف + الفئات + إعدادات المصنع فقط — سجل الحركات لا يُمس أبدًا)
create or replace function public.restore_backup(backup_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  snapshot jsonb;
begin
  if not is_admin() then
    raise exception 'هذه العملية لمدير النظام فقط';
  end if;

  select data into snapshot from backups where id = backup_id;
  if snapshot is null then
    raise exception 'النسخة الاحتياطية غير موجودة';
  end if;

  -- نسخة أمان تلقائية قبل أي استعادة (احتياط داخل الاحتياط)
  perform create_backup('نسخة تلقائية قبل الاستعادة');

  delete from items;
  insert into items select * from jsonb_populate_recordset(null::items, snapshot->'items');

  delete from categories;
  insert into categories select * from jsonb_populate_recordset(null::categories, snapshot->'categories');

  update settings s set
    workshop_name = x.workshop_name, logo_base64 = x.logo_base64,
    alert_threshold_percent = x.alert_threshold_percent, warning_threshold_percent = x.warning_threshold_percent,
    address = x.address, phone = x.phone
  from jsonb_populate_recordset(null::settings, snapshot->'settings') x
  where s.id = x.id;
end;
$$;
grant execute on function public.restore_backup(uuid) to authenticated;

-- جدولة نسخة احتياطية تلقائية يوميًا
-- الوقت مضبوط '0 21 * * *' = الساعة 11 مساءً بتوقيت القاهرة/تركيا تقريبًا (UTC+2/+3)
-- عدّل الرقم لو فرق التوقيت مختلف عندك (الصيغة الأولى = الدقيقة، الثانية = الساعة بتوقيت UTC)
select cron.schedule(
  'nightly-inventory-backup',
  '0 21 * * *',
  $$select public.create_backup('نسخة تلقائية يومية')$$
);

-- ============================================================
-- ملاحظة: الاستعادة بتُرجع الأصناف والفئات وبيانات المصنع فقط لحالتها وقت أخذ النسخة.
-- سجل الحركات (transactions) وسجل العمليات (audit_log) لا يُمسان أبدًا حتى لا يضيع أي تاريخ حقيقي.
-- ============================================================
