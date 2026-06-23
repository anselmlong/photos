# Booking & Quote System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-facing booking enquiry form at `/booking` and a private admin quote-builder at `/admin/quote` that generates a downloadable PDF.

**Architecture:** The booking form (react-hook-form + zod) POSTs to `/api/enquiry`, which sends a formatted email via Resend with a magic link encoding the submission as a URL param. The admin quote page decodes that param, lets Anselm adjust pricing, and renders a PDF via `@react-pdf/renderer` entirely client-side — no database, no auth, no file storage in MVP.

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · react-hook-form · zod · Resend · @react-pdf/renderer · bun (package manager)

---

## File Map

| File | Create/Modify | Responsibility |
|---|---|---|
| `src/lib/types.ts` | Create | `BookingEnquiry`, `QuoteData`, `LineItem` types |
| `src/lib/booking-schema.ts` | Create | Zod schema matching `BookingEnquiry`; shared by form + API |
| `src/app/booking/page.tsx` | Create | Public enquiry form — four collapsible sections, react-hook-form |
| `src/app/booking/success/page.tsx` | Create | Thank-you page shown after successful submission |
| `src/app/api/enquiry/route.ts` | Create | POST handler: validates, sends Resend email, returns `{ok:true}` |
| `src/app/_components/QuotePDF.tsx` | Create | `@react-pdf/renderer` Document — white/minimal, all styling inline |
| `src/app/_components/PDFDownloadButton.tsx` | Create | Thin client component wrapping `PDFDownloadLink` (needs `'use client'` + dynamic import to avoid SSR crash) |
| `src/app/admin/quote/page.tsx` | Create | Admin quote builder — decodes URL param, editable line items, live totals preview, PDF download |
| `src/app/_components/Navigation.tsx` | Modify | Add `/booking` link to nav |

---

## Task 1: Install dependencies

- [ ] **Step 1: Install all required packages**

```bash
bun add resend @react-pdf/renderer react-hook-form zod @hookform/resolvers
bun add -d @types/react-pdf
```

- [ ] **Step 2: Verify installation**

```bash
cat package.json | grep -E '"resend|react-pdf|react-hook-form|zod|hookform'
```

Expected output (versions may vary):
```
"@hookform/resolvers": "^3.x.x",
"@react-pdf/renderer": "^4.x.x",
"react-hook-form": "^7.x.x",
"resend": "^x.x.x",
"zod": "^3.x.x",
```

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "deps: add resend, react-pdf, react-hook-form, zod"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/lib/types.ts

export type Service     = 'photography' | 'videography' | 'both';
export type Deliverable = 'photos' | 'reel' | 'both' | 'raw';
export type Turnaround  = 'standard' | 'rush';

export interface BookingEnquiry {
  // Section A — Client
  name:          string;
  email:         string;
  phone?:        string;
  referral?:     string;

  // Section B — Event
  eventTitle:    string;
  eventType:     string;
  eventDate:     string;   // ISO date string YYYY-MM-DD
  startTime:     string;   // 'HH:MM'
  endTime:       string;   // 'HH:MM'
  venue:         string;
  venueAddress?: string;

  // Section C — Services
  services:      Service;
  duration:      string;
  guestCount?:   number;
  budget?:       string;
  deliverables?: Deliverable;
  turnaround?:   Turnaround;

  // Section D — Other
  specialRequests?:  string;
  returningClient?:  boolean;
  preferredContact?: 'email' | 'whatsapp';
}

export interface LineItem {
  description: string;
  qty:         number; // hours
  rate:        number; // SGD per hour
}

export interface QuoteData {
  enquiry:       BookingEnquiry;
  quoteNum:      string;
  lineItems:     LineItem[];
  discount?:     number;
  discountNote?: string;
  paymentTerms:  string;
  validDays:     number;
  notes?:        string;
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(booking): add BookingEnquiry, QuoteData, LineItem types"
```

---

## Task 3: Zod validation schema

**Files:**
- Create: `src/lib/booking-schema.ts`

- [ ] **Step 1: Create the schema**

```typescript
// src/lib/booking-schema.ts
import { z } from 'zod';

export const bookingSchema = z.object({
  // Section A
  name:     z.string().min(1, 'Name is required'),
  email:    z.string().email('Valid email required'),
  phone:    z.string().optional(),
  referral: z.string().optional(),

  // Section B
  eventTitle: z.string().min(1, 'Event title is required'),
  eventType:  z.string().min(1, 'Event type is required'),
  eventDate:  z.string().min(1, 'Event date is required'),
  startTime:  z.string().min(1, 'Start time is required'),
  endTime:    z.string().min(1, 'End time is required'),
  venue:      z.string().min(1, 'Venue name is required'),
  venueAddress: z.string().optional(),

  // Section C
  services:    z.enum(['photography', 'videography', 'both']),
  duration:    z.string().min(1, 'Duration is required'),
  guestCount:  z.coerce.number().optional(),
  budget:      z.string().optional(),
  deliverables: z.enum(['photos', 'reel', 'both', 'raw']).optional(),
  turnaround:  z.enum(['standard', 'rush']).optional(),

  // Section D
  specialRequests:  z.string().optional(),
  returningClient:  z.boolean().optional(),
  preferredContact: z.enum(['email', 'whatsapp']).optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/booking-schema.ts
git commit -m "feat(booking): add zod schema for booking form validation"
```

---

## Task 4: Booking form page

**Files:**
- Create: `src/app/booking/page.tsx`

This is a client component. Each of the four sections is collapsible via a `<details>` element. On submit it POSTs to `/api/enquiry` then redirects to `/booking/success`.

- [ ] **Step 1: Create the booking page**

```tsx
// src/app/booking/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/app/_components/Navigation';
import { bookingSchema, type BookingFormValues } from '@/lib/booking-schema';

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <summary className="flex cursor-pointer items-center justify-between py-4 select-none">
      <div>
        <span className="font-serif text-lg text-foreground">{title}</span>
        <span className="ml-3 text-sm text-foreground-muted">{subtitle}</span>
      </div>
      <span className="text-foreground-muted text-xl transition-transform group-open:rotate-180">▾</span>
    </summary>
  );
}

function Field({ label, required, error, children }: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground-muted">
        {label}{required && <span className="ml-0.5 text-foreground/40">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border/50 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20";
const selectCls = `${inputCls} appearance-none`;

export default function BookingPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { turnaround: 'standard' },
  });

  async function onSubmit(data: BookingFormValues) {
    const res = await fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push('/booking/success');
    } else {
      alert('Something went wrong — please try again or email anselmpius@gmail.com directly.');
    }
  }

  return (
    <>
      <Navigation variant="solid" />
      <main className="mx-auto max-w-2xl px-6 pt-32 pb-24 md:px-12">
        <h1 className="font-serif text-3xl md:text-4xl mb-2">Book a session</h1>
        <p className="text-foreground-muted mb-10 text-sm">Fill in what you know — Anselm will get back to you within 24 hours.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {/* Section A */}
          <details open className="group rounded-xl border border-border/40 px-5">
            <SectionHeader title="About you" subtitle="Contact details" />
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name?.message}>
                <input {...register('name')} placeholder="Sarah Tan" className={inputCls} />
              </Field>
              <Field label="Email address" required error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="sarah@email.com" className={inputCls} />
              </Field>
              <Field label="Phone / WhatsApp" error={errors.phone?.message}>
                <input {...register('phone')} type="tel" placeholder="+65 9123 4567" className={inputCls} />
              </Field>
              <Field label="How did you hear about us?">
                <select {...register('referral')} className={selectCls}>
                  <option value="">Select…</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Referral">Referral</option>
                  <option value="Google">Google</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
          </details>

          {/* Section B */}
          <details open className="group rounded-xl border border-border/40 px-5">
            <SectionHeader title="Your event" subtitle="Date, venue, details" />
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <Field label="Event title / name" required error={errors.eventTitle?.message}>
                <input {...register('eventTitle')} placeholder="Luna's 4th Birthday" className={inputCls} />
              </Field>
              <Field label="Event type" required error={errors.eventType?.message}>
                <select {...register('eventType')} className={selectCls}>
                  <option value="">Select…</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Others">Others</option>
                </select>
              </Field>
              <Field label="Event date" required error={errors.eventDate?.message}>
                <input {...register('eventDate')} type="date" className={inputCls} />
              </Field>
              <Field label="Time" required error={errors.startTime?.message ?? errors.endTime?.message}>
                <div className="flex items-center gap-2">
                  <input {...register('startTime')} type="time" className={inputCls} />
                  <span className="text-foreground-muted shrink-0">–</span>
                  <input {...register('endTime')} type="time" className={inputCls} />
                </div>
              </Field>
              <Field label="Venue name" required error={errors.venue?.message}>
                <input {...register('venue')} placeholder="The Westin Singapore" className={inputCls} />
              </Field>
              <Field label="Venue address" error={errors.venueAddress?.message}>
                <textarea {...register('venueAddress')} rows={2} placeholder="Full address" className={inputCls} />
              </Field>
            </div>
          </details>

          {/* Section C */}
          <details open className="group rounded-xl border border-border/40 px-5">
            <SectionHeader title="Services" subtitle="What you need" />
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <Field label="Services wanted" required error={errors.services?.message}>
                <select {...register('services')} className={selectCls}>
                  <option value="">Select…</option>
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="both">Both</option>
                </select>
              </Field>
              <Field label="Estimated duration" required error={errors.duration?.message}>
                <select {...register('duration')} className={selectCls}>
                  <option value="">Select…</option>
                  <option value="1h">1 hour</option>
                  <option value="2h">2 hours</option>
                  <option value="3h">3 hours</option>
                  <option value="4h">4 hours</option>
                  <option value="half-day">Half day</option>
                  <option value="full-day">Full day</option>
                </select>
              </Field>
              <Field label="Number of guests (approx.)" error={errors.guestCount?.message}>
                <input {...register('guestCount')} type="number" min={0} placeholder="50" className={inputCls} />
              </Field>
              <Field label="Budget range (SGD)" error={errors.budget?.message}>
                <select {...register('budget')} className={selectCls}>
                  <option value="">Select…</option>
                  <option value="$0–300">$0 – $300</option>
                  <option value="$300–600">$300 – $600</option>
                  <option value="$600–1000">$600 – $1,000</option>
                  <option value="$1000+">$1,000+</option>
                </select>
              </Field>
              <Field label="Deliverables needed" error={errors.deliverables?.message}>
                <select {...register('deliverables')} className={selectCls}>
                  <option value="">Select…</option>
                  <option value="photos">Edited photos</option>
                  <option value="reel">Highlight reel</option>
                  <option value="both">Both</option>
                  <option value="raw">Raw files</option>
                </select>
              </Field>
              <Field label="Turnaround preference" error={errors.turnaround?.message}>
                <select {...register('turnaround')} className={selectCls}>
                  <option value="standard">Standard (14 days)</option>
                  <option value="rush">Rush (7 days, +30%)</option>
                </select>
              </Field>
            </div>
          </details>

          {/* Section D */}
          <details open className="group rounded-xl border border-border/40 px-5">
            <SectionHeader title="Anything else?" subtitle="Optional extras" />
            <div className="flex flex-col gap-4 pb-5">
              <Field label="Special requests" error={errors.specialRequests?.message}>
                <textarea
                  {...register('specialRequests')}
                  rows={4}
                  placeholder="Mood references, shot lists, access notes, specific moments to capture…"
                  className={inputCls}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Have we worked together before?">
                  <div className="flex gap-5 pt-1">
                    {(['true', 'false'] as const).map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          value={v}
                          {...register('returningClient', {
                            setValueAs: (v) => v === 'true',
                          })}
                          className="accent-foreground"
                        />
                        {v === 'true' ? 'Yes' : 'No'}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Preferred contact method">
                  <div className="flex gap-5 pt-1">
                    {(['email', 'whatsapp'] as const).map((v) => (
                      <label key={v} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                        <input type="radio" value={v} {...register('preferredContact')} className="accent-foreground" />
                        {v === 'email' ? 'Email' : 'WhatsApp'}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </details>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-full border border-foreground/20 px-8 py-3 text-sm transition-all duration-300 hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            {isSubmitting ? 'Sending…' : 'Send enquiry'}
          </button>
        </form>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/booking/page.tsx
git commit -m "feat(booking): add multi-section booking enquiry form"
```

---

## Task 5: Booking success page

**Files:**
- Create: `src/app/booking/success/page.tsx`

- [ ] **Step 1: Create the success page**

```tsx
// src/app/booking/success/page.tsx
import Link from 'next/link';
import { Navigation } from '@/app/_components/Navigation';

export default function BookingSuccessPage() {
  return (
    <>
      <Navigation variant="solid" />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-5xl">✉️</p>
        <h1 className="font-serif text-3xl md:text-4xl mb-3">Enquiry received</h1>
        <p className="text-foreground-muted max-w-sm text-sm leading-relaxed mb-8">
          Thank you! Anselm will review your brief and get back to you within 24 hours with a personalised quote.
        </p>
        <Link
          href="/"
          className="rounded-full border border-foreground/20 px-6 py-2.5 text-sm transition-all duration-300 hover:bg-foreground hover:text-background"
        >
          Back to portfolio
        </Link>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/booking/success/page.tsx
git commit -m "feat(booking): add booking success page"
```

---

## Task 6: API route — POST /api/enquiry

**Files:**
- Create: `src/app/api/enquiry/route.ts`

Before this step you need a Resend API key in `.env.local`. If you don't have one yet, sign up at resend.com, verify your domain (3 DNS records), and create an API key. Add to `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=anselmpius@gmail.com
NEXT_PUBLIC_URL=https://anselmlong.com
```

For local testing set `NEXT_PUBLIC_URL=http://localhost:3000`.

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/enquiry/route.ts
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { bookingSchema } from '@/lib/booking-schema';
import type { BookingEnquiry } from '@/lib/types';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.', issues: parsed.error.issues }, { status: 422 });
  }

  const data = parsed.data as BookingEnquiry;
  const encoded  = encodeURIComponent(JSON.stringify(data));
  const quoteUrl = `${process.env.NEXT_PUBLIC_URL}/admin/quote?data=${encoded}`;

  const { error } = await resend.emails.send({
    from:    'Anselm Long Bookings <bookings@anselmlong.com>',
    to:      process.env.ADMIN_EMAIL!,
    subject: `New enquiry: ${data.eventTitle} — ${data.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;color:#111">
        <h2 style="margin-bottom:4px">New booking enquiry</h2>
        <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
        <p><b>Client:</b> ${data.name} (${data.email})</p>
        ${data.phone ? `<p><b>Phone:</b> ${data.phone}</p>` : ''}
        <p><b>Event:</b> ${data.eventTitle} — ${data.eventType}</p>
        <p><b>Date:</b> ${data.eventDate} · ${data.startTime}–${data.endTime}</p>
        <p><b>Venue:</b> ${data.venue}${data.venueAddress ? `, ${data.venueAddress}` : ''}</p>
        <p><b>Services:</b> ${data.services} · ${data.duration}</p>
        ${data.budget ? `<p><b>Budget:</b> ${data.budget}</p>` : ''}
        ${data.deliverables ? `<p><b>Deliverables:</b> ${data.deliverables}</p>` : ''}
        ${data.turnaround ? `<p><b>Turnaround:</b> ${data.turnaround}</p>` : ''}
        <p><b>Returning client:</b> ${data.returningClient ? 'Yes' : 'No'}</p>
        ${data.specialRequests ? `<p><b>Special requests:</b><br/>${data.specialRequests}</p>` : ''}
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
        <p>
          <a href="${quoteUrl}" style="background:#111;color:#fff;padding:10px 20px;border-radius:20px;text-decoration:none;font-size:14px">
            Open quote builder →
          </a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Test the API locally**

Start the dev server:
```bash
bun dev
```

In a second terminal, send a test POST:
```bash
curl -s -X POST http://localhost:3000/api/enquiry \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Test Client","email":"test@test.com",
    "eventTitle":"Test Event","eventType":"Birthday",
    "eventDate":"2026-07-15","startTime":"10:00","endTime":"14:00",
    "venue":"Test Venue","services":"photography","duration":"4h"
  }' | jq .
```

Expected: `{"ok":true}` and an email arrives at anselmpius@gmail.com.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/enquiry/route.ts
git commit -m "feat(booking): add POST /api/enquiry route with Resend email"
```

---

## Task 7: QuotePDF component

**Files:**
- Create: `src/app/_components/QuotePDF.tsx`

`@react-pdf/renderer` renders a PDF from a React tree using its own layout engine — it does NOT use HTML or Tailwind. All styles are inline via `StyleSheet.create()`. Use the `'use client'` directive because pdf rendering only works in the browser.

- [ ] **Step 1: Create QuotePDF.tsx**

```tsx
// src/app/_components/QuotePDF.tsx
'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { QuoteData } from '@/lib/types';

const styles = StyleSheet.create({
  page:       { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#111', backgroundColor: '#fff' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24,
                borderBottomWidth: 1, borderBottomColor: '#111', paddingBottom: 14 },
  brand:      { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  brandSub:   { fontSize: 8, color: '#666', marginTop: 2 },
  quoteTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  quoteNum:   { fontSize: 8, color: '#666', textAlign: 'right', marginTop: 2 },
  muted:      { color: '#666', fontSize: 8 },
  metaGrid:   { flexDirection: 'row', gap: 40, marginBottom: 20 },
  metaBlock:  { flex: 1 },
  label:      { fontSize: 7, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  value:      { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  valueSub:   { fontSize: 8, color: '#444', marginTop: 1 },
  tableHead:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#111',
                paddingBottom: 6, marginBottom: 4, marginTop: 16 },
  tableRow:   { flexDirection: 'row', paddingVertical: 6,
                borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  colDesc:    { flex: 4, fontSize: 9 },
  colNum:     { flex: 1, fontSize: 9, textAlign: 'right' },
  totalBox:   { backgroundColor: '#f5f5f5', padding: 12, marginTop: 12, borderRadius: 4 },
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalFinal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
                paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ccc' },
  totalFinalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  totalFinalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  section:    { marginTop: 20 },
  tcText:     { fontSize: 7.5, color: '#666', lineHeight: 1.6 },
  sig:        { flexDirection: 'row', gap: 40, marginTop: 28 },
  sigBlock:   { flex: 1, borderTopWidth: 0.5, borderTopColor: '#999', paddingTop: 6 },
  sigLabel:   { fontSize: 7, color: '#999' },
  noteText:   { fontSize: 8.5, color: '#333', lineHeight: 1.6 },
});

function formatSGD(n: number) {
  return `SGD ${n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function QuotePDF({ data }: { data: QuoteData }) {
  const { enquiry, quoteNum, lineItems, discount, discountNote, paymentTerms, validDays, notes } = data;

  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.rate, 0);
  const discountAmt = discount ?? 0;
  const total = subtotal - discountAmt;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  const validStr = validUntil.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Anselm Long</Text>
            <Text style={styles.brandSub}>Photography & Videography · Singapore</Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>anselmpius@gmail.com · +65 8853 6376</Text>
          </View>
          <View>
            <Text style={styles.quoteTitle}>QUOTATION</Text>
            <Text style={styles.quoteNum}>#{quoteNum}</Text>
            <Text style={[styles.muted, { textAlign: 'right', marginTop: 4 }]}>
              Valid until {validStr}
            </Text>
          </View>
        </View>

        {/* Client + Event meta */}
        <View style={styles.metaGrid}>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Prepared for</Text>
            <Text style={styles.value}>{enquiry.name}</Text>
            <Text style={styles.valueSub}>{enquiry.email}</Text>
            {enquiry.phone && <Text style={styles.valueSub}>{enquiry.phone}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Event</Text>
            <Text style={styles.value}>{enquiry.eventTitle}</Text>
            <Text style={styles.valueSub}>{enquiry.eventDate} · {enquiry.startTime}–{enquiry.endTime}</Text>
            <Text style={styles.valueSub}>{enquiry.venue}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Services</Text>
            <Text style={styles.value} style={{ textTransform: 'capitalize' }}>{enquiry.services}</Text>
            <Text style={styles.valueSub}>{enquiry.duration}</Text>
            {enquiry.turnaround === 'rush' && <Text style={styles.valueSub}>Rush delivery</Text>}
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.tableHead}>
          <Text style={[styles.colDesc, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Description</Text>
          <Text style={[styles.colNum, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Hrs</Text>
          <Text style={[styles.colNum, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Rate</Text>
          <Text style={[styles.colNum, { fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>Amount</Text>
        </View>
        {lineItems.map((li, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{li.description}</Text>
            <Text style={styles.colNum}>{li.qty}</Text>
            <Text style={styles.colNum}>{formatSGD(li.rate)}</Text>
            <Text style={styles.colNum}>{formatSGD(li.qty * li.rate)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatSGD(subtotal)}</Text>
          </View>
          {discountAmt > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Discount{discountNote ? ` (${discountNote})` : ''}</Text>
              <Text>−{formatSGD(discountAmt)}</Text>
            </View>
          )}
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>Total (SGD)</Text>
            <Text style={styles.totalFinalValue}>{formatSGD(total)}</Text>
          </View>
        </View>

        {/* Notes to client */}
        {notes && (
          <View style={styles.section}>
            <Text style={[styles.label, { marginBottom: 4 }]}>Notes</Text>
            <Text style={styles.noteText}>{notes}</Text>
          </View>
        )}

        {/* Payment terms */}
        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Payment Terms</Text>
          <Text style={styles.tcText}>{paymentTerms}</Text>
        </View>

        {/* T&Cs */}
        <View style={styles.section}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Terms & Conditions</Text>
          <Text style={styles.tcText}>
            {'A 50% deposit is required to confirm the booking. The remaining balance is due 7 days before the event. ' +
            'Standard turnaround is 14 days from event date. Rush delivery (7 days) incurs a 30% surcharge. ' +
            'Cancellations within 14 days of the event forfeit the deposit. Travel outside Singapore is charged at cost.'}
          </Text>
        </View>

        {/* Signature blocks */}
        <View style={styles.sig}>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>Client signature & date</Text>
          </View>
          <View style={styles.sigBlock}>
            <Text style={styles.sigLabel}>Anselm Long · anselmpius@gmail.com</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/QuotePDF.tsx
git commit -m "feat(quote): add QuotePDF react-pdf document component"
```

---

## Task 8: PDFDownloadButton wrapper

**Files:**
- Create: `src/app/_components/PDFDownloadButton.tsx`

`PDFDownloadLink` uses browser-only APIs. It crashes on the server if imported directly. Wrap it in a client component that is dynamically imported with `ssr: false` in the admin page.

- [ ] **Step 1: Create PDFDownloadButton.tsx**

```tsx
// src/app/_components/PDFDownloadButton.tsx
'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotePDF } from './QuotePDF';
import type { QuoteData } from '@/lib/types';

interface Props {
  data: QuoteData;
  fileName: string;
}

export function PDFDownloadButton({ data, fileName }: Props) {
  return (
    <PDFDownloadLink document={<QuotePDF data={data} />} fileName={fileName}>
      {({ loading }) => (
        <button
          className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-opacity hover:opacity-80 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Preparing PDF…' : 'Download Quote PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_components/PDFDownloadButton.tsx
git commit -m "feat(quote): add PDFDownloadButton client component"
```

---

## Task 9: Admin quote page

**Files:**
- Create: `src/app/admin/quote/page.tsx`

This is a client component. On load it reads the `data` URL param, decodes it, and pre-fills the form. Anselm can then add/edit line items, discount, notes, and download the PDF.

Left panel (40%): editable quote fields.
Right panel (60%): live HTML preview of the quote layout so Anselm can see what the PDF will look like before downloading.

- [ ] **Step 1: Create the admin quote page**

```tsx
// src/app/admin/quote/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { BookingEnquiry, QuoteData, LineItem } from '@/lib/types';

const PDFDownloadButton = dynamic(
  () => import('@/app/_components/PDFDownloadButton').then((m) => m.PDFDownloadButton),
  { ssr: false, loading: () => <button disabled className="rounded-full bg-foreground/40 px-6 py-2.5 text-sm text-background">Loading…</button> }
);

const inputCls = "w-full rounded border border-border/40 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-foreground/30 focus:outline-none";

function formatSGD(n: number) {
  return `SGD ${n.toLocaleString('en-SG', { minimumFractionDigits: 2 })}`;
}

function MetaBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1">
      <p className="mb-0.5 text-[10px] uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="text-sm font-semibold text-neutral-900">{value}</p>
      {sub && <p className="text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

export default function AdminQuotePage() {
  const [enquiry, setEnquiry] = useState<BookingEnquiry | null>(null);
  const [quoteNum, setQuoteNum] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', qty: 1, rate: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [discountNote, setDiscountNote] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('50% deposit on booking, 50% due 7 days before the event.');
  const [validDays, setValidDays] = useState(14);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('data');
    if (!raw) return;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as BookingEnquiry;
      setEnquiry(parsed);
      // Pre-populate a line item from the service type
      setLineItems([{ description: `${parsed.services} — ${parsed.eventTitle}`, qty: 1, rate: 0 }]);
    } catch {
      console.error('Failed to parse enquiry data from URL');
    }
  }, []);

  const subtotal = useMemo(() => lineItems.reduce((s, li) => s + li.qty * li.rate, 0), [lineItems]);
  const total = subtotal - (discount ?? 0);

  const quoteData: QuoteData | null = enquiry
    ? { enquiry, quoteNum, lineItems, discount, discountNote, paymentTerms, validDays, notes }
    : null;

  const fileName = quoteData
    ? `Quote_${quoteNum || 'DRAFT'}_${enquiry!.name.replace(/\s+/g, '_')}.pdf`
    : 'Quote.pdf';

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: '', qty: 1, rate: 0 }]);
  }

  function removeLineItem(i: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLineItem(i: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((li, idx) => (idx === i ? { ...li, [field]: value } : li))
    );
  }

  if (!enquiry) {
    return (
      <main className="flex min-h-screen items-center justify-center text-foreground-muted text-sm">
        No enquiry data found in URL. Open this page from the email link.
      </main>
    );
  }

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);
  const validStr = validUntil.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="flex min-h-screen flex-col md:flex-row gap-0">

      {/* ── Left panel: controls ── */}
      <aside className="w-full md:w-[40%] border-r border-border/40 bg-background/80 p-6 overflow-y-auto">
        <h1 className="font-serif text-2xl mb-1">Quote builder</h1>
        <p className="text-foreground-muted text-xs mb-6">
          {enquiry.name} · {enquiry.eventTitle} · {enquiry.eventDate}
        </p>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground-muted">Quote number</label>
            <input
              value={quoteNum}
              onChange={(e) => setQuoteNum(e.target.value)}
              placeholder="2026-001"
              className={inputCls}
            />
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs text-foreground-muted mb-2">Line items</p>
            <div className="flex flex-col gap-2">
              {lineItems.map((li, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    value={li.description}
                    onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className={`${inputCls} flex-[3]`}
                  />
                  <input
                    type="number"
                    value={li.qty}
                    min={0}
                    onChange={(e) => updateLineItem(i, 'qty', parseFloat(e.target.value) || 0)}
                    placeholder="Hrs"
                    className={`${inputCls} w-16 flex-none`}
                  />
                  <input
                    type="number"
                    value={li.rate}
                    min={0}
                    onChange={(e) => updateLineItem(i, 'rate', parseFloat(e.target.value) || 0)}
                    placeholder="Rate"
                    className={`${inputCls} w-24 flex-none`}
                  />
                  <button
                    onClick={() => removeLineItem(i)}
                    className="mt-2 text-foreground-muted hover:text-foreground text-lg leading-none"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addLineItem}
              className="mt-2 text-xs text-foreground-muted hover:text-foreground underline"
            >
              + Add line item
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs text-foreground-muted">Discount (SGD)</label>
              <input
                type="number"
                value={discount}
                min={0}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-[2]">
              <label className="text-xs text-foreground-muted">Discount note</label>
              <input
                value={discountNote}
                onChange={(e) => setDiscountNote(e.target.value)}
                placeholder="e.g. Returning client"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground-muted">Payment terms</label>
            <textarea
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground-muted">Valid for (days)</label>
            <input
              type="number"
              value={validDays}
              min={1}
              onChange={(e) => setValidDays(parseInt(e.target.value) || 14)}
              className={`${inputCls} w-24`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground-muted">Notes to client</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything specific to this enquiry…"
              className={inputCls}
            />
          </div>

          <div className="pt-2">
            {quoteData && (
              <PDFDownloadButton data={quoteData} fileName={fileName} />
            )}
          </div>
        </div>
      </aside>

      {/* ── Right panel: live HTML preview ── */}
      <section className="flex-1 bg-neutral-100 p-8 overflow-y-auto">
        <div className="mx-auto max-w-[560px] bg-white shadow-sm rounded-sm p-10 text-neutral-900 font-sans text-[9pt]">

          {/* Preview header */}
          <div className="flex justify-between items-start pb-4 mb-6 border-b border-neutral-900">
            <div>
              <p className="text-[15pt] font-bold leading-tight">Anselm Long</p>
              <p className="text-[8pt] text-neutral-500 mt-0.5">Photography & Videography · Singapore</p>
              <p className="text-[8pt] text-neutral-400 mt-1">anselmpius@gmail.com · +65 8853 6376</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[10pt]">QUOTATION</p>
              <p className="text-[8pt] text-neutral-500">#{quoteNum || '—'}</p>
              <p className="text-[8pt] text-neutral-400 mt-1">Valid until {validStr}</p>
            </div>
          </div>

          {/* Meta grid */}
          <div className="flex gap-8 mb-5">
            <MetaBlock label="Prepared for" value={enquiry.name} sub={enquiry.email} />
            <MetaBlock label="Event" value={enquiry.eventTitle} sub={`${enquiry.eventDate} · ${enquiry.startTime}–${enquiry.endTime}`} />
            <MetaBlock label="Services" value={enquiry.services} sub={enquiry.duration} />
          </div>

          {/* Table */}
          <div className="mt-4">
            <div className="flex border-b border-neutral-900 pb-1.5 mb-1 text-[7pt] font-bold uppercase tracking-wide text-neutral-500">
              <span className="flex-[4]">Description</span>
              <span className="flex-1 text-right">Hrs</span>
              <span className="flex-1 text-right">Rate</span>
              <span className="flex-1 text-right">Amount</span>
            </div>
            {lineItems.map((li, i) => (
              <div key={i} className="flex py-1.5 border-b border-neutral-100">
                <span className="flex-[4] text-[9pt]">{li.description || '—'}</span>
                <span className="flex-1 text-right text-[9pt]">{li.qty}</span>
                <span className="flex-1 text-right text-[9pt]">{formatSGD(li.rate)}</span>
                <span className="flex-1 text-right text-[9pt]">{formatSGD(li.qty * li.rate)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-3 bg-neutral-50 rounded p-3">
            <div className="flex justify-between py-1 text-[9pt] text-neutral-500">
              <span>Subtotal</span><span>{formatSGD(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-1 text-[9pt] text-neutral-500">
                <span>Discount{discountNote ? ` (${discountNote})` : ''}</span>
                <span>−{formatSGD(discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2 border-t border-neutral-200">
              <span className="font-bold text-[11pt]">Total (SGD)</span>
              <span className="font-bold text-[11pt]">{formatSGD(total)}</span>
            </div>
          </div>

          {notes && (
            <div className="mt-4">
              <p className="text-[7pt] uppercase tracking-widest text-neutral-400 mb-1">Notes</p>
              <p className="text-[8.5pt] text-neutral-600 leading-relaxed whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          <div className="mt-4">
            <p className="text-[7pt] uppercase tracking-widest text-neutral-400 mb-1">Payment Terms</p>
            <p className="text-[7.5pt] text-neutral-500 leading-relaxed">{paymentTerms}</p>
          </div>

          <div className="mt-4">
            <p className="text-[7pt] uppercase tracking-widest text-neutral-400 mb-1">Terms & Conditions</p>
            <p className="text-[7.5pt] text-neutral-500 leading-relaxed">
              A 50% deposit is required to confirm the booking. The remaining balance is due 7 days before the event.
              Standard turnaround is 14 days from event date. Rush delivery (7 days) incurs a 30% surcharge.
              Cancellations within 14 days of the event forfeit the deposit. Travel outside Singapore is charged at cost.
            </p>
          </div>

          {/* Signature blocks */}
          <div className="flex gap-8 mt-7">
            <div className="flex-1 border-t border-neutral-400 pt-1.5">
              <p className="text-[7pt] text-neutral-400">Client signature & date</p>
            </div>
            <div className="flex-1 border-t border-neutral-400 pt-1.5">
              <p className="text-[7pt] text-neutral-400">Anselm Long · anselmpius@gmail.com</p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/quote/page.tsx
git commit -m "feat(admin): add quote builder with live preview and PDF download"
```

---

## Task 10: Add /booking link to Navigation

**Files:**
- Modify: `src/app/_components/Navigation.tsx`

- [ ] **Step 1: Add the Book link**

In `Navigation.tsx`, inside the `<div className={cn("flex items-center gap-5 md:gap-6", ...)}` block, add a link to `/booking` before the existing "Get in Touch" link:

```tsx
// Add this Link import if not already present — it's already imported
<Link
  href="/booking"
  className={cn(
    "text-sm transition-colors",
    variant === "overlay"
      ? "text-white/70 hover:text-white"
      : "text-foreground-muted hover:text-foreground"
  )}
>
  Book a session
</Link>
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
bunx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/Navigation.tsx
git commit -m "feat(nav): add Book a session link"
```

---

## Task 11: End-to-end smoke test

- [ ] **Step 1: Start the dev server**

```bash
bun dev
```

- [ ] **Step 2: Visit the booking form**

Open `http://localhost:3000/booking`. Verify:
- All four sections render and are open by default
- Required field validation fires on submit with empty fields (should show red error text)
- Filling all required fields and submitting POSTs to `/api/enquiry`
- On success you're redirected to `/booking/success`
- The success page shows the thank-you message and a back link

- [ ] **Step 3: Check the email**

Open anselmpius@gmail.com. Verify:
- Email subject contains event title and client name
- "Open quote builder →" link is present

- [ ] **Step 4: Test the admin quote builder**

Click the "Open quote builder →" link from the email. Verify:
- `http://localhost:3000/admin/quote?data=...` loads
- Fields are pre-filled from the submission data
- Adding line items updates the live preview immediately
- Subtotal, discount, and total calculate correctly in the preview
- "Download Quote PDF" downloads a PDF file with the correct filename
- PDF opens in viewer and all sections (header, meta, line items, totals, T&Cs, signatures) render correctly

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: booking enquiry form, email notification, and PDF quote builder — MVP complete"
```

---

## Self-review

**Spec coverage check:**
- ✅ Section A–D all fields — Task 4
- ✅ `BookingEnquiry` type — Task 2
- ✅ `QuoteData` / `LineItem` types — Task 2
- ✅ Zod validation schema — Task 3
- ✅ POST `/api/enquiry` with Resend — Task 6
- ✅ `/booking/success` page — Task 5
- ✅ `QuotePDF.tsx` with all specified style keys — Task 7
- ✅ `PDFDownloadLink` with correct filename — Task 8 + Task 9
- ✅ Admin quote page: pre-fill from URL, editable line items, live totals, live preview, PDF download — Task 9
- ✅ Resend env vars documented — Task 6
- ✅ Navigation link — Task 10

**Type consistency check:**
- `BookingEnquiry`, `QuoteData`, `LineItem` defined once in `src/lib/types.ts` (Task 2), imported in QuotePDF (Task 7), PDFDownloadButton (Task 8), and admin quote page (Task 9)
- `bookingSchema` defined in `src/lib/booking-schema.ts` (Task 3), imported in `/api/enquiry/route.ts` (Task 6) and booking form (Task 4)
- `formatSGD` defined inline in both QuotePDF (Task 7) and the HTML preview in the admin page (Task 9) — intentional since they're separate render contexts (PDF engine vs DOM)

**No placeholders:** All steps contain complete, runnable code.
