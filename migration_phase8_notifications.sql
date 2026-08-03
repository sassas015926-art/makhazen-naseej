-- ============================================================
-- ملف ترحيل إضافي — نظام Telegram + التقرير اليومي
-- شغّله في Supabase SQL Editor. كله إضافة أعمدة/جدولة فقط، صفر تعديل
-- على أي جدول أو بيانات موجودة.
-- ============================================================

-- أعمدة جديدة في settings (كلها بقيم افتراضية آمنة، مفيش تأثير على الصفوف الموجودة)
alter table settings add column if not exists daily_report_enabled boolean default true;
alter table settings add column if not exists daily_report_time text default '16:00';
alter table settings add column if not exists last_daily_report_sent_at timestamptz;

-- تفعيل الإضافات المطلوبة للجدولة (متاحة على كل خطط Supabase بما فيها المجانية)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============================================================
-- ⚠️ الخطوتين دول لازم يتعملوا يدويًا من SQL Editor مرة واحدة بس (قبل تشغيل
-- جزء cron.schedule تحت)، ومتحطهمش في أي ملف هترفعه على GitHub — عشان
-- مفتاح service role مايتسربش في تاريخ الـ repo:
--
--   select vault.create_secret('ألصق_مفتاح_service_role_هنا', 'service_role_key');
--   select vault.create_secret('https://ألصق_رابط_مشروعك_هنا.supabase.co/functions/v1/daily-report-service', 'daily_report_function_url');
--
-- المفتاح تلاقيه في: Supabase Dashboard → Project Settings → API → service_role key
-- الرابط تلاقيه في نفس الصفحة (Project URL) — أو من رابط الداشبورد بتاعك.
--
-- ملحوظة: دول مش "تعديل في الملف ده" — هما أمرين بتشغلهم مباشرة في SQL Editor
-- مرة واحدة بس، والملف ده نفسه (تحت) هتشغّله زي ما هو من غير أي تعديل خالص.
-- ============================================================

-- جدولة فحص كل 15 دقيقة — الفنكشن نفسها بتقرر لو الوقت مناسب للإرسال ولا لأ
-- (الملف ده جاهز للتشغيل زي ما هو، من غير أي قيمة تحتاج تستبدلها يدويًا)
select
  cron.schedule(
    'daily-report-check',
    '*/15 * * * *',
    $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'daily_report_function_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb
    );
    $$
  );

-- للتأكد إن الجدولة اتسجّلت صح:
--   select * from cron.job;
-- لمتابعة نتيجة كل تشغيلة:
--   select * from cron.job_run_details order by start_time desc limit 20;
-- لإيقاف الجدولة نهائيًا لو احتجت:
--   select cron.unschedule('daily-report-check');
