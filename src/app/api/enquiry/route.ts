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
  const origin = process.env.NEXT_PUBLIC_URL ?? new URL(req.url).origin;
  const quoteUrl = `${origin}/admin/quote?data=${encodeURIComponent(JSON.stringify(data))}`;
  const adminEmail = process.env.ADMIN_EMAIL ?? "anselmpius@gmail.com";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "Anselm Long Bookings <bookings@anselmlong.com>";

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
          Open quote builder -&gt;
        </a>
      </p>
    </div>
  `;

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Email is not configured." }, { status: 500 });
    }

    console.info("Skipping Resend email because RESEND_API_KEY is not configured.", {
      adminEmail,
      quoteUrl,
    });
    return NextResponse.json({ ok: true, skippedEmail: true, quoteUrl });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `New enquiry: ${data.eventTitle} - ${data.name}`,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
