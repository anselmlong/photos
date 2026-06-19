import { appendMessage, getRedis, isValidSession } from "@/lib/chat-store";

export const runtime = "nodejs";

/** Visitor sends a message: store it + forward to Anselm's Telegram with a routing tag. */
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const redis = getRedis();

  if (!token || !chatId || !redis) {
    return Response.json({ error: "Live chat isn't configured yet." }, { status: 503 });
  }

  let body: { session?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const session = body.session;
  const text = (body.text ?? "").toString().trim();
  if (!isValidSession(session)) {
    return Response.json({ error: "Invalid session." }, { status: 400 });
  }
  if (text.length < 1 || text.length > 2000) {
    return Response.json({ error: "Message must be 1–2000 characters." }, { status: 400 });
  }

  await appendMessage(redis, session, { from: "visitor", text, ts: Date.now() });

  // Forward to Telegram. The [#session] tag lets the webhook route Anselm's reply back.
  const tgText = `💬 [#${session}] new message from photos.anselmlong.com\n\n${text}\n\n↩️ Reply to this message to respond.`;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: tgText, disable_web_page_preview: true }),
  });

  if (!res.ok) {
    return Response.json({ error: "Couldn't deliver the message. Try again." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
