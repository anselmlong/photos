import { appendMessage, getRedis, touchHostPresence } from "@/lib/chat-store";

export const runtime = "nodejs";

const SESSION_TAG = /\[#([a-zA-Z0-9]{6,32})\]/;

/**
 * Telegram webhook. When Anselm REPLIES to a forwarded "[#session] ..." message
 * in his bot chat, we route that reply back to the matching visitor thread.
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const redis = getRedis();

  // Validate the request actually came from Telegram (secret token header).
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("forbidden", { status: 403 });
  }
  if (!redis || !chatId) return Response.json({ ok: true });

  let update: any;
  try {
    update = await req.json();
  } catch {
    return Response.json({ ok: true });
  }

  const msg = update?.message;
  const text: string | undefined = msg?.text;
  const fromChat = String(msg?.chat?.id ?? "");
  const repliedText: string | undefined = msg?.reply_to_message?.text;

  // Only accept replies from Anselm's own chat.
  if (!text || fromChat !== String(chatId)) return Response.json({ ok: true });

  // Any message from Anselm marks him as recently active.
  await touchHostPresence(redis);

  const tag = repliedText?.match(SESSION_TAG);
  if (!tag) {
    // Anselm sent something without replying to a tagged message — nudge him.
    await notify(`To reply to a visitor, swipe-reply to their "[#…]" message.`);
    return Response.json({ ok: true });
  }

  const session = tag[1];
  await appendMessage(redis, session, { from: "host", text: text.trim(), ts: Date.now() });
  return Response.json({ ok: true });
}

async function notify(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}
