/**
 * One-time: register the Telegram bot webhook so Anselm's replies reach the site.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=xxx TELEGRAM_WEBHOOK_SECRET=yyy \
 *   node scripts/set-telegram-webhook.mjs https://photos.anselmlong.com
 *
 * The secret must match the TELEGRAM_WEBHOOK_SECRET env var set in Vercel.
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const base = process.argv[2];

if (!token || !secret || !base) {
  console.error("Need TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET env vars and a base URL arg.");
  process.exit(1);
}

const url = `${base.replace(/\/$/, "")}/api/telegram/webhook`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  }),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
process.exit(data.ok ? 0 : 1);
