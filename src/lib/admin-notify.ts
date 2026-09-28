import { Resend } from "resend";

/** Best-effort ping to Anselm: Telegram first, then email. Returns the channel used. */
export async function notifyAdmin(message: { subject: string; text: string; html: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message.text, disable_web_page_preview: true }),
    }).catch(() => null);
    if (res?.ok) return "telegram";
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Anselm Long Bookings <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL ?? "anselmpius@gmail.com",
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (!error) return "email";
  }

  return null;
}
