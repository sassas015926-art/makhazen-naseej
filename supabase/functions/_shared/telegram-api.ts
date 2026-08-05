// ============================================================
// ملف مشترك: التواصل المباشر مع Telegram Bot API
// ============================================================

export type TelegramSendResult =
  | { ok: true }
  | { ok: false; blocked: boolean; errorMessage: string };

/**
 * إرسال رسالة نصية لمستخدم واحد عبر تيليجرام.
 * blocked=true يعني: المستخدم حظر البوت / حذف المحادثة / حسابه معطل —
 * يعني ميستحقش نحاول نبعتله تاني لحد ما يفعّل البوت من جديد.
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string
): Promise<TelegramSendResult> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );
    const data = await res.json();

    if (data.ok) return { ok: true };

    const desc: string = data.description || "خطأ غير معروف من تيليجرام";
    const blocked = /blocked|chat not found|user is deactivated|kicked|bot was kicked/i.test(
      desc
    );
    return { ok: false, blocked, errorMessage: desc };
  } catch (e) {
    return {
      ok: false,
      blocked: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}
