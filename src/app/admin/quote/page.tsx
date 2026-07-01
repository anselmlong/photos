"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { bookingSchema } from "@/lib/booking-schema";
import type { BookingEnquiry, LineItem, QuoteData } from "@/lib/types";

const PDFDownloadButton = dynamic(
  () => import("@/app/_components/PDFDownloadButton").then((module) => module.PDFDownloadButton),
  {
    loading: () => (
      <button
        disabled
        className="rounded-full bg-foreground/40 px-6 py-2.5 text-sm text-background"
      >
        Loading...
      </button>
    ),
    ssr: false,
  }
);

const inputClassName =
  "w-full rounded-sm border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-foreground/40 focus:outline-none";

function formatSGD(value: number) {
  return `SGD ${value.toLocaleString("en-SG", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function estimateHours(duration: string) {
  if (duration === "half-day") return 4;
  if (duration === "full-day") return 8;
  const match = duration.match(/^(\d+)/);
  return match ? Number(match[1]) : 1;
}

function decodeEnquiryPayload(raw: string) {
  const candidates = [raw];
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded !== raw) candidates.push(decoded);
  } catch {
    // URLSearchParams usually returns decoded values already.
  }

  for (const candidate of candidates) {
    try {
      const parsed = bookingSchema.safeParse(JSON.parse(candidate));
      if (parsed.success) {
        return parsed.data;
      }
    } catch {
      // Try the next decoding candidate.
    }
  }

  return null;
}

function makeQuoteNumber() {
  return `Q-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
}

function makeFileName(quoteNum: string, enquiry: BookingEnquiry) {
  const client = enquiry.name.trim().replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "");
  return `Quote_${quoteNum || "DRAFT"}_${client || "Client"}.pdf`;
}

function MetaBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-0.5 text-[10px] uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="truncate text-sm font-semibold text-neutral-900">{value}</p>
      {sub && <p className="truncate text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-foreground-muted">{label}</label>
      {children}
    </div>
  );
}

export default function AdminQuotePage() {
  const [enquiry, setEnquiry] = useState<BookingEnquiry | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [quoteNum, setQuoteNum] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "Coverage", qty: 1, rate: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [discountNote, setDiscountNote] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(
    "50% deposit on booking, 50% due 7 days before the event."
  );
  const [validDays, setValidDays] = useState(14);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setQuoteNum(makeQuoteNumber());

    const raw = new URLSearchParams(window.location.search).get("data");
    if (!raw) {
      setParseError("No enquiry data found in the URL.");
      return;
    }

    const decoded = decodeEnquiryPayload(raw);
    if (!decoded) {
      setParseError("The enquiry data in the URL could not be read.");
      return;
    }

    setEnquiry(decoded);
    setLineItems([
      {
        description: `${formatLabel(decoded.services)} coverage - ${decoded.eventTitle}`,
        qty: estimateHours(decoded.duration),
        rate: 0,
      },
    ]);
  }, []);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.qty * item.rate, 0),
    [lineItems]
  );
  const safeDiscount = Math.max(0, discount);
  const total = Math.max(0, subtotal - safeDiscount);

  const quoteData: QuoteData | null = enquiry
    ? {
        discount: safeDiscount,
        discountNote,
        enquiry,
        lineItems,
        notes,
        paymentTerms,
        quoteNum,
        validDays,
      }
    : null;

  const fileName = quoteData ? makeFileName(quoteNum, quoteData.enquiry) : "Quote.pdf";
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + Math.max(1, validDays));
  const validStr = validUntil.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", qty: 1, rate: 0 }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  }

  function updateEnquiryField<K extends keyof BookingEnquiry>(
    field: K,
    value: BookingEnquiry[K]
  ) {
    setEnquiry((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  if (!enquiry) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-foreground-muted">
        {parseError ?? "Loading enquiry data..."}
      </main>
    );
  }

  const firstName = enquiry.name.trim().split(/\s+/)[0] || enquiry.name;
  const clientEmailSubject = encodeURIComponent(
    `Quotation ${quoteNum || ""} for ${enquiry.eventTitle}`.trim()
  );
  const clientEmailBody = encodeURIComponent(
    `Hi ${firstName},\n\nThanks for sharing the details for ${enquiry.eventTitle}. Please find the quotation PDF attached.\n\nBest,\nAnselm`
  );
  const clientEmailHref = `mailto:${enquiry.email}?subject=${clientEmailSubject}&body=${clientEmailBody}`;

  return (
    <main className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="w-full border-b border-border/50 bg-background/95 p-6 md:h-screen md:w-[40%] md:overflow-y-auto md:border-r md:border-b-0">
        <h1 className="mb-1 font-serif text-2xl">Quote builder</h1>
        <p className="mb-6 text-xs text-foreground-muted">
          {enquiry.name} - {enquiry.eventTitle} - {enquiry.eventDate}
        </p>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground-muted">Quote number</label>
            <input
              value={quoteNum}
              onChange={(event) => setQuoteNum(event.target.value)}
              placeholder="Q-20260715"
              className={inputClassName}
            />
          </div>

          <div className="border-t border-border/50 pt-5">
            <p className="mb-3 text-xs uppercase tracking-widest text-foreground-muted">
              Client details
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Client name">
                <input
                  value={enquiry.name}
                  onChange={(event) => updateEnquiryField("name", event.target.value)}
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Client email">
                <input
                  type="email"
                  value={enquiry.email}
                  onChange={(event) => updateEnquiryField("email", event.target.value)}
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Phone / WhatsApp">
                <input
                  value={enquiry.phone ?? ""}
                  onChange={(event) =>
                    updateEnquiryField("phone", event.target.value || undefined)
                  }
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Preferred contact">
                <select
                  value={enquiry.preferredContact ?? ""}
                  onChange={(event) =>
                    updateEnquiryField(
                      "preferredContact",
                      (event.target.value || undefined) as BookingEnquiry["preferredContact"]
                    )
                  }
                  className={inputClassName}
                >
                  <option value="">Not specified</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </EditorField>
            </div>
          </div>

          <div className="border-t border-border/50 pt-5">
            <p className="mb-3 text-xs uppercase tracking-widest text-foreground-muted">
              Event details
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <EditorField label="Event title">
                <input
                  value={enquiry.eventTitle}
                  onChange={(event) => updateEnquiryField("eventTitle", event.target.value)}
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Event type">
                <input
                  value={enquiry.eventType}
                  onChange={(event) => updateEnquiryField("eventType", event.target.value)}
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Event date">
                <input
                  type="date"
                  value={enquiry.eventDate}
                  onChange={(event) => updateEnquiryField("eventDate", event.target.value)}
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Time">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    type="time"
                    value={enquiry.startTime}
                    onChange={(event) => updateEnquiryField("startTime", event.target.value)}
                    className={inputClassName}
                  />
                  <span className="text-xs text-foreground-muted">to</span>
                  <input
                    type="time"
                    value={enquiry.endTime}
                    onChange={(event) => updateEnquiryField("endTime", event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </EditorField>
              <EditorField label="Venue">
                <input
                  value={enquiry.venue}
                  onChange={(event) => updateEnquiryField("venue", event.target.value)}
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Venue address">
                <textarea
                  value={enquiry.venueAddress ?? ""}
                  onChange={(event) =>
                    updateEnquiryField("venueAddress", event.target.value || undefined)
                  }
                  rows={2}
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Services">
                <select
                  value={enquiry.services}
                  onChange={(event) =>
                    updateEnquiryField("services", event.target.value as BookingEnquiry["services"])
                  }
                  className={inputClassName}
                >
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="both">Both</option>
                </select>
              </EditorField>
              <EditorField label="Duration">
                <input
                  value={enquiry.duration}
                  onChange={(event) => updateEnquiryField("duration", event.target.value)}
                  className={inputClassName}
                />
              </EditorField>
              <EditorField label="Deliverables">
                <select
                  value={enquiry.deliverables ?? ""}
                  onChange={(event) =>
                    updateEnquiryField(
                      "deliverables",
                      (event.target.value || undefined) as BookingEnquiry["deliverables"]
                    )
                  }
                  className={inputClassName}
                >
                  <option value="">Not specified</option>
                  <option value="photos">Edited photos</option>
                  <option value="reel">Highlight reel</option>
                  <option value="both">Both</option>
                  <option value="raw">Raw files</option>
                </select>
              </EditorField>
              <EditorField label="Turnaround">
                <select
                  value={enquiry.turnaround ?? ""}
                  onChange={(event) =>
                    updateEnquiryField(
                      "turnaround",
                      (event.target.value || undefined) as BookingEnquiry["turnaround"]
                    )
                  }
                  className={inputClassName}
                >
                  <option value="">Not specified</option>
                  <option value="standard">Standard</option>
                  <option value="rush">Rush</option>
                </select>
              </EditorField>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs text-foreground-muted">Line items</p>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs text-foreground-muted underline-offset-4 hover:text-foreground hover:underline"
              >
                Add line item
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_64px_88px_28px] gap-2">
                  <input
                    value={item.description}
                    onChange={(event) =>
                      updateLineItem(index, "description", event.target.value)
                    }
                    placeholder="Description"
                    className={inputClassName}
                  />
                  <input
                    type="number"
                    value={item.qty}
                    min={0}
                    step={0.5}
                    onChange={(event) =>
                      updateLineItem(index, "qty", Math.max(0, Number(event.target.value) || 0))
                    }
                    aria-label="Hours"
                    className={inputClassName}
                  />
                  <input
                    type="number"
                    value={item.rate}
                    min={0}
                    onChange={(event) =>
                      updateLineItem(index, "rate", Math.max(0, Number(event.target.value) || 0))
                    }
                    aria-label="Rate"
                    className={inputClassName}
                  />
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                    aria-label="Remove line item"
                    className="text-lg leading-none text-foreground-muted hover:text-foreground disabled:opacity-30"
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-foreground-muted">Discount (SGD)</label>
              <input
                type="number"
                value={discount}
                min={0}
                onChange={(event) => setDiscount(Math.max(0, Number(event.target.value) || 0))}
                className={inputClassName}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-foreground-muted">Discount note</label>
              <input
                value={discountNote}
                onChange={(event) => setDiscountNote(event.target.value)}
                placeholder="Returning client"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground-muted">Payment terms</label>
            <textarea
              value={paymentTerms}
              onChange={(event) => setPaymentTerms(event.target.value)}
              rows={2}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground-muted">Valid for (days)</label>
            <input
              type="number"
              value={validDays}
              min={1}
              onChange={(event) => setValidDays(Math.max(1, Number(event.target.value) || 14))}
              className={`${inputClassName} max-w-28`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground-muted">Notes to client</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Anything specific to this enquiry..."
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex flex-wrap gap-2">
              {quoteData && <PDFDownloadButton data={quoteData} fileName={fileName} />}
              <a
                href={clientEmailHref}
                className="inline-flex rounded-full border border-foreground/20 px-6 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Open client email draft
              </a>
            </div>
            <p className="text-xs leading-relaxed text-foreground-muted">
              Download the PDF first, then attach it to the email draft before sending.
            </p>
          </div>
        </div>
      </aside>

      <section className="flex-1 overflow-x-auto bg-neutral-100 p-5 md:h-screen md:overflow-y-auto md:p-8">
        <div className="mx-auto min-w-[560px] max-w-[640px] rounded-sm bg-white p-10 font-sans text-[9pt] text-neutral-900 shadow-sm">
          <div className="mb-6 flex items-start justify-between border-b border-neutral-900 pb-4">
            <div>
              <p className="text-[15pt] font-bold leading-tight">Anselm Long</p>
              <p className="mt-0.5 text-[8pt] text-neutral-500">
                Photography & Videography - Singapore
              </p>
              <p className="mt-1 text-[8pt] text-neutral-400">
                anselmpius@gmail.com - +65 8853 6376
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10pt] font-bold">QUOTATION</p>
              <p className="text-[8pt] text-neutral-500">#{quoteNum || "DRAFT"}</p>
              <p className="mt-1 text-[8pt] text-neutral-400">Valid until {validStr}</p>
            </div>
          </div>

          <div className="mb-5 flex gap-8">
            <MetaBlock
              label="Prepared for"
              value={enquiry.name}
              sub={`${enquiry.email}${enquiry.phone ? ` - ${enquiry.phone}` : ""}`}
            />
            <MetaBlock
              label="Event"
              value={`${enquiry.eventTitle} (${enquiry.eventType})`}
              sub={`${enquiry.eventDate} - ${enquiry.startTime}-${enquiry.endTime}`}
            />
            <MetaBlock
              label="Services"
              value={formatLabel(enquiry.services)}
              sub={`${enquiry.duration}${enquiry.turnaround === "rush" ? " - rush" : ""}`}
            />
          </div>

          <div className="mb-5 border-y border-neutral-100 py-3 text-[8pt] leading-relaxed text-neutral-500">
            <p>
              <span className="font-bold text-neutral-700">Venue:</span> {enquiry.venue}
              {enquiry.venueAddress ? `, ${enquiry.venueAddress}` : ""}
            </p>
            {enquiry.deliverables && (
              <p>
                <span className="font-bold text-neutral-700">Deliverables:</span>{" "}
                {formatLabel(enquiry.deliverables)}
              </p>
            )}
          </div>

          <div className="mt-4">
            <div className="mb-1 flex border-b border-neutral-900 pb-1.5 text-[7pt] font-bold uppercase tracking-wide text-neutral-500">
              <span className="flex-[4]">Description</span>
              <span className="flex-1 text-right">Hrs</span>
              <span className="flex-1 text-right">Rate</span>
              <span className="flex-1 text-right">Amount</span>
            </div>
            {lineItems.map((item, index) => (
              <div key={index} className="flex border-b border-neutral-100 py-1.5">
                <span className="flex-[4] text-[9pt]">{item.description || "Coverage"}</span>
                <span className="flex-1 text-right text-[9pt]">{item.qty}</span>
                <span className="flex-1 text-right text-[9pt]">{formatSGD(item.rate)}</span>
                <span className="flex-1 text-right text-[9pt]">
                  {formatSGD(item.qty * item.rate)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-sm bg-neutral-50 p-3">
            <div className="flex justify-between py-1 text-[9pt] text-neutral-500">
              <span>Subtotal</span>
              <span>{formatSGD(subtotal)}</span>
            </div>
            {safeDiscount > 0 && (
              <div className="flex justify-between py-1 text-[9pt] text-neutral-500">
                <span>Discount{discountNote ? ` (${discountNote})` : ""}</span>
                <span>-{formatSGD(safeDiscount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2">
              <span className="text-[11pt] font-bold">Total (SGD)</span>
              <span className="text-[11pt] font-bold">{formatSGD(total)}</span>
            </div>
          </div>

          {notes && (
            <div className="mt-4">
              <p className="mb-1 text-[7pt] uppercase tracking-widest text-neutral-400">Notes</p>
              <p className="whitespace-pre-wrap text-[8.5pt] leading-relaxed text-neutral-600">
                {notes}
              </p>
            </div>
          )}

          <div className="mt-4">
            <p className="mb-1 text-[7pt] uppercase tracking-widest text-neutral-400">
              Payment Terms
            </p>
            <p className="text-[7.5pt] leading-relaxed text-neutral-500">{paymentTerms}</p>
          </div>

          <div className="mt-4">
            <p className="mb-1 text-[7pt] uppercase tracking-widest text-neutral-400">
              Terms & Conditions
            </p>
            <p className="text-[7.5pt] leading-relaxed text-neutral-500">
              A 50% deposit is required to confirm the booking. The remaining balance is due 7 days
              before the event. Standard turnaround is 14 days from event date. Rush delivery is 7
              days and incurs a 30% surcharge. Cancellations within 14 days of the event forfeit the
              deposit. Travel outside Singapore is charged at cost.
            </p>
          </div>

          <div className="mt-7 flex gap-8">
            <div className="flex-1 border-t border-neutral-400 pt-1.5">
              <p className="text-[7pt] text-neutral-400">Client signature and date</p>
            </div>
            <div className="flex-1 border-t border-neutral-400 pt-1.5">
              <p className="text-[7pt] text-neutral-400">Anselm Long - anselmpius@gmail.com</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
