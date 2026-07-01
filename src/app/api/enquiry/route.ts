import { NextResponse } from "next/server";
import { Resend } from "resend";
import { bookingSchema } from "@/lib/booking-schema";

export const runtime = "nodejs";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function htmlLine(label: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return `<p><b>${escapeHtml(label)}:</b> ${escapeHtml(value)}</p>`;
}

function htmlMultiline(label: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return `<p><b>${escapeHtml(label)}:</b><br/>${escapeHtml(value).replaceAll("\n", "<br/>")}</p>`;
}

function getOrigin(req: Request) {
  return (process.env.NEXT_PUBLIC_URL ?? new URL(req.url).origin).replace(/\/$/, "");
}

function errorMessage(error: unknown) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function sendTelegramFallback(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, error: "Telegram fallback is not configured." };
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });

  if (!res.ok) {
    return { ok: false, error: `Telegram fallback failed with ${res.status}.` };
  }

  return { ok: true, error: null };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const origin = getOrigin(req);
  const quoteUrl = `${origin}/admin/quote?data=${encodeURIComponent(JSON.stringify(data))}`;
  const adminEmail = process.env.ADMIN_EMAIL ?? "anselmpius@gmail.com";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "Anselm Long Bookings <onboarding@resend.dev>";
  const text = [
    "New booking enquiry",
    "",
    `Client: ${data.name} (${data.email})`,
    data.phone ? `Phone: ${data.phone}` : "",
    `Preferred contact: ${data.preferredContact ?? "Not specified"}`,
    `Event: ${data.eventTitle} - ${data.eventType}`,
    `Date: ${data.eventDate} ${data.startTime}-${data.endTime}`,
    `Venue: ${data.venue}${data.venueAddress ? `, ${data.venueAddress}` : ""}`,
    `Services: ${data.services} - ${data.duration}`,
    data.budget ? `Budget: ${data.budget}` : "",
    data.deliverables ? `Deliverables: ${data.deliverables}` : "",
    data.specialRequests ? `Special requests: ${data.specialRequests}` : "",
    "",
    `Open editable quote: ${quoteUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#111;line-height:1.5">
      <h2 style="margin:0 0 4px">New booking enquiry</h2>
      <p style="margin:0;color:#666;font-size:13px">Submitted from anselmlong.com</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      ${htmlLine("Client", `${data.name} (${data.email})`)}
      ${htmlLine("Phone", data.phone)}
      ${htmlLine("Preferred contact", data.preferredContact)}
      ${htmlLine("Referral", data.referral)}
      ${htmlLine("Event", `${data.eventTitle} - ${data.eventType}`)}
      ${htmlLine("Date", `${data.eventDate} ${data.startTime}-${data.endTime}`)}
      ${htmlLine("Venue", `${data.venue}${data.venueAddress ? `, ${data.venueAddress}` : ""}`)}
      ${htmlLine("Services", `${data.services} - ${data.duration}`)}
      ${htmlLine("Guest count", data.guestCount)}
      ${htmlLine("Budget", data.budget)}
      ${htmlLine("Deliverables", data.deliverables)}
      ${htmlLine("Turnaround", data.turnaround)}
      ${htmlLine("Returning client", data.returningClient ? "Yes" : "No")}
      ${htmlMultiline("Special requests", data.specialRequests)}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <p>
        <a href="${escapeHtml(quoteUrl)}" style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-size:14px">
          Open editable quote -&gt;
        </a>
      </p>
      <p style="color:#666;font-size:12px;word-break:break-all">
        If the button does not open, copy this link:<br/>
        ${escapeHtml(quoteUrl)}
      </p>
    </div>
  `;

  let emailError: string | null = null;
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      replyTo: data.email,
      subject: `New enquiry: ${data.eventTitle} - ${data.name}`,
      html,
      text,
    });

    if (!error) {
      return NextResponse.json({
        ok: true,
        notification: "email",
        ...(process.env.NODE_ENV === "production" ? {} : { quoteUrl }),
      });
    }

    emailError = errorMessage(error);
    console.error("Resend enquiry notification failed:", emailError);
  } else {
    emailError = "RESEND_API_KEY is not configured.";
  }

  const telegram = await sendTelegramFallback(text);
  if (telegram.ok) {
    return NextResponse.json({
      ok: true,
      notification: "telegram",
      ...(process.env.NODE_ENV === "production" ? {} : { emailError, quoteUrl }),
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("No enquiry notification provider succeeded.", {
      adminEmail,
      emailError,
      telegramError: telegram.error,
      quoteUrl,
    });
    return NextResponse.json({
      ok: true,
      notification: "development",
      emailError,
      telegramError: telegram.error,
      quoteUrl,
    });
  }

  return NextResponse.json(
    {
      error: "The enquiry was received, but no admin notification could be sent.",
      detail: "Check RESEND_API_KEY, RESEND_FROM_EMAIL, ADMIN_EMAIL, or Telegram fallback env vars.",
    },
    { status: 502 }
  );
}
