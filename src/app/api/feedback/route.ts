import { NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/feedback-schema";
import { submitFeedback } from "@/lib/feedback-store";
import { notifyAdmin } from "@/lib/admin-notify";
import { publicError, readPublicJson, reservePublicRequest } from "@/lib/public-request";

export const runtime = "nodejs";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(req: Request) {
  let body: unknown;
  let redis;
  try {
    redis = await reservePublicRequest(req, "feedback", 5);
    body = await readPublicJson(req);
  } catch (error) {
    return publicError(error);
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.issues }, { status: 422 });
  }
  // Bots that fill the honeypot get a quiet success and nothing is stored.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  let token: string;
  try { ({ token } = await submitFeedback(redis, parsed.data)); }
  catch (error) { return publicError(error); }

  const origin = (process.env.NEXT_PUBLIC_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const reviewUrl = `${origin}/admin/feedback#token=${token}`;
  const { name, shootType, rating, message } = parsed.data;
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  const channel = await notifyAdmin({
    subject: `New feedback from ${name}`,
    text: [`New feedback ${stars}`, `${name} · ${shootType}`, "", message, "", `Approve or discard: ${reviewUrl}`].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;color:#111;line-height:1.5">
        <h2 style="margin:0 0 4px">New feedback ${stars}</h2>
        <p style="margin:0;color:#666;font-size:13px">${escapeHtml(name)} · ${escapeHtml(shootType)}</p>
        <blockquote style="margin:16px 0;padding-left:12px;border-left:3px solid #ddd">${escapeHtml(message).replaceAll("\n", "<br/>")}</blockquote>
        <p><a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px">Review feedback -&gt;</a></p>
      </div>`,
  });
  if (!channel) console.error("Feedback stored but no admin notification could be sent.");

  return NextResponse.json({
    ok: true,
    ...(process.env.NODE_ENV === "production" ? {} : { reviewUrl }),
  });
}
