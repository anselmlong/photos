"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Navigation } from "@/app/_components/Navigation";
import { bookingSchema, type BookingFormInput, type BookingFormValues } from "@/lib/booking-schema";

type FieldName = keyof BookingFormInput;

// Mirrors the required fields in bookingSchema, so labels and assistive tech agree with validation.
const REQUIRED = new Set<FieldName>([
  "name",
  "email",
  "eventTitle",
  "eventType",
  "eventDate",
  "startTime",
  "endTime",
  "venue",
  "services",
  "duration",
]);

function Chevron({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <summary className="-mx-5 flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground/60 [&::-webkit-details-marker]:hidden">
      <div>
        <span className="font-serif text-lg text-foreground">{title}</span>
        <span className="ml-3 text-sm text-foreground-muted">{subtitle}</span>
      </div>
      <Chevron className="h-4 w-4 shrink-0 text-foreground-muted motion-safe:transition-transform motion-safe:duration-300 group-open:rotate-180" />
    </summary>
  );
}

function Field({
  label,
  htmlFor,
  errorId = `${htmlFor}-error`,
  error,
  children,
}: {
  label: string;
  htmlFor: FieldName;
  errorId?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-foreground-muted">
        {label}
        {REQUIRED.has(htmlFor) && (
          <span aria-hidden className="ml-0.5 text-foreground/45">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/** Radio and checkbox sets carry their own labels, so the heading is a legend rather than a label. */
function ChoiceGroup({ legend, error, children }: { legend: string; error?: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm text-foreground-muted">{legend}</legend>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </fieldset>
  );
}

const inputClassName =
  "w-full rounded-sm border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 transition-colors focus:border-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 aria-[invalid=true]:border-red-400/70";

/** appearance-none drops the native arrow, so draw one back in. */
function Select(props: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select {...props} className={`${inputClassName} appearance-none pr-10`} />
      <Chevron className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
    </div>
  );
}

export default function BookingPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormInput, unknown, BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      turnaround: "standard",
      preferredContact: "email",
      returningClient: false,
    },
  });

  /** register() plus the id, required and error wiring that ties each control to its label and message. */
  const field = (name: FieldName, errorId = `${name}-error`) => ({
    ...register(name),
    id: name,
    "aria-required": REQUIRED.has(name) || undefined,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? errorId : undefined,
  });

  async function onSubmit(data: BookingFormValues) {
    setSubmitError(null);

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/booking/success");
        return;
      }
    } catch {
      // Offline or the request never landed; fall through to the same message.
    }

    setSubmitError("The enquiry could not be sent. Please email anselmpius@gmail.com directly.");
  }

  return (
    <>
      <Navigation variant="solid" />
      <main className="mx-auto max-w-2xl px-6 pt-32 pb-24 md:px-12">
        <h1 className="mb-2 font-serif text-3xl md:text-4xl">Book a session</h1>
        <p className="mb-10 text-sm leading-relaxed text-foreground-muted">
          Share the details you have and Anselm will reply with a tailored quote. Fields marked{" "}
          <span className="text-foreground/45">*</span> are required.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <details open className="group border border-border/50 px-5">
            <SectionHeader title="About you" subtitle="Contact details" />
            <div className="grid grid-cols-1 gap-4 pb-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" error={errors.name?.message}>
                <input {...field("name")} autoComplete="name" placeholder="Sarah Tan" className={inputClassName} />
              </Field>
              <Field label="Email address" htmlFor="email" error={errors.email?.message}>
                <input
                  {...field("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="sarah@email.com"
                  className={inputClassName}
                />
              </Field>
              <Field label="Phone / WhatsApp" htmlFor="phone" error={errors.phone?.message}>
                <input
                  {...field("phone")}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+65 9123 4567"
                  className={inputClassName}
                />
              </Field>
              <Field label="How did you hear about us?" htmlFor="referral" error={errors.referral?.message}>
                <Select {...field("referral")}>
                  <option value="">Select...</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Referral">Referral</option>
                  <option value="Google">Google</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>
            </div>
          </details>

          <details open className="group border border-border/50 px-5">
            <SectionHeader title="Your event" subtitle="Date, venue, details" />
            <div className="grid grid-cols-1 gap-4 pb-5 sm:grid-cols-2">
              <Field label="Event title / name" htmlFor="eventTitle" error={errors.eventTitle?.message}>
                <input {...field("eventTitle")} placeholder="Luna's 4th Birthday" className={inputClassName} />
              </Field>
              <Field label="Event type" htmlFor="eventType" error={errors.eventType?.message}>
                <Select {...field("eventType")}>
                  <option value="">Select...</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Portraits">Portraits</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>
              <Field label="Event date" htmlFor="eventDate" error={errors.eventDate?.message}>
                <input {...field("eventDate")} type="date" className={inputClassName} />
              </Field>
              <Field
                label="Time"
                htmlFor="startTime"
                errorId="time-error"
                error={errors.startTime?.message ?? errors.endTime?.message}
              >
                <div className="flex items-center gap-2">
                  <input
                    {...field("startTime", "time-error")}
                    type="time"
                    aria-label="Start time"
                    className={`${inputClassName} min-w-0 px-3`}
                  />
                  <span aria-hidden className="shrink-0 text-foreground-muted">
                    to
                  </span>
                  <input
                    {...field("endTime", "time-error")}
                    type="time"
                    aria-label="End time"
                    className={`${inputClassName} min-w-0 px-3`}
                  />
                </div>
              </Field>
              <Field label="Venue name" htmlFor="venue" error={errors.venue?.message}>
                <input {...field("venue")} placeholder="The Westin Singapore" className={inputClassName} />
              </Field>
              <Field label="Venue address" htmlFor="venueAddress" error={errors.venueAddress?.message}>
                <textarea
                  {...field("venueAddress")}
                  rows={2}
                  placeholder="Full address"
                  className={inputClassName}
                />
              </Field>
            </div>
          </details>

          <details open className="group border border-border/50 px-5">
            <SectionHeader title="Services" subtitle="Coverage and delivery" />
            <div className="grid grid-cols-1 gap-4 pb-5 sm:grid-cols-2">
              <Field label="Services wanted" htmlFor="services" error={errors.services?.message}>
                <Select {...field("services")}>
                  <option value="">Select...</option>
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="both">Both</option>
                </Select>
              </Field>
              <Field label="Estimated duration" htmlFor="duration" error={errors.duration?.message}>
                <Select {...field("duration")}>
                  <option value="">Select...</option>
                  <option value="1h">1 hour</option>
                  <option value="2h">2 hours</option>
                  <option value="3h">3 hours</option>
                  <option value="4h">4 hours</option>
                  <option value="half-day">Half day</option>
                  <option value="full-day">Full day</option>
                </Select>
              </Field>
              <Field label="Number of guests" htmlFor="guestCount" error={errors.guestCount?.message}>
                <input
                  {...field("guestCount")}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="50"
                  className={inputClassName}
                />
              </Field>
              <Field label="Budget range (SGD)" htmlFor="budget" error={errors.budget?.message}>
                <Select {...field("budget")}>
                  <option value="">Select...</option>
                  <option value="$0-300">$0-300</option>
                  <option value="$300-600">$300-600</option>
                  <option value="$600-1000">$600-1,000</option>
                  <option value="$1000+">$1,000+</option>
                </Select>
              </Field>
              <Field label="Deliverables needed" htmlFor="deliverables" error={errors.deliverables?.message}>
                <Select {...field("deliverables")}>
                  <option value="">Select...</option>
                  <option value="photos">Edited photos</option>
                  <option value="reel">Highlight reel</option>
                  <option value="both">Both</option>
                  <option value="raw">Raw files</option>
                </Select>
              </Field>
              <Field label="Turnaround preference" htmlFor="turnaround" error={errors.turnaround?.message}>
                <Select {...field("turnaround")}>
                  <option value="standard">Standard (14 days)</option>
                  <option value="rush">Rush (7 days, +30%)</option>
                </Select>
              </Field>
            </div>
          </details>

          <details open className="group border border-border/50 px-5">
            <SectionHeader title="Anything else?" subtitle="Notes and preferences" />
            <div className="flex flex-col gap-4 pb-5">
              <Field label="Special requests" htmlFor="specialRequests" error={errors.specialRequests?.message}>
                <textarea
                  {...field("specialRequests")}
                  rows={4}
                  placeholder="Mood references, shot lists, access notes, specific moments to capture..."
                  className={inputClassName}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <ChoiceGroup legend="Returning client" error={errors.returningClient?.message}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      {...register("returningClient")}
                      className="h-4 w-4 accent-foreground"
                    />
                    Yes, we have worked together before
                  </label>
                </ChoiceGroup>
                <ChoiceGroup legend="Preferred contact method" error={errors.preferredContact?.message}>
                  <div className="flex gap-5">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value="email"
                        {...register("preferredContact")}
                        className="accent-foreground"
                      />
                      Email
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        value="whatsapp"
                        {...register("preferredContact")}
                        className="accent-foreground"
                      />
                      WhatsApp
                    </label>
                  </div>
                </ChoiceGroup>
              </div>
            </div>
          </details>

          {submitError && (
            <p role="alert" className="text-sm text-red-400">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex justify-center rounded-full border border-foreground/20 px-8 py-3 text-sm transition-all duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send enquiry"}
          </button>
        </form>
      </main>
    </>
  );
}
