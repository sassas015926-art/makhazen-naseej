// ============================================================
// ملف مشترك: إنشاء عميل Supabase بصلاحية service role
// (بيتخطى RLS بالكامل — يُستخدم فقط داخل Edge Functions، أبدًا في الفرونت إند)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
