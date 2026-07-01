"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Navigation } from "@/app/_components/Navigation";
import { bookingSchema, type BookingFormInput, type BookingFormValues } from "@/lib/booking-schema";

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 select-none [&::-webkit-details-marker]:hidden">
      <div>
        <span className="font-serif text-lg text-foreground">{title}</span>
        <span className="ml-3 text-sm text-foreground-muted">{subtitle}</span>
      </div>
      <span className="text-xl leading-none text-foreground-muted transition-transform group-open:rotate-180">
        v
      </span>
    </summary>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground-muted">
        {label}
        {required && <span className="ml-0.5 text-foreground/45">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputClassName =
  "w-full rounded-sm border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/50 transition-colors focus:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20";
const selectClassName = `${inputClassName} appearance-none`;

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

  async function onSubmit(data: BookingFormValues) {
    setSubmitError(null);

    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/booking/success");
      return;
    }

    setSubmitError("The enquiry could not be sent. Please email anselmpius@gmail.com directly.");
  }

  return (
    <>
      <Navigation variant="solid" />
      <main className="mx-auto max-w-2xl px-6 pt-32 pb-24 md:px-12">
        <h1 className="mb-2 font-serif text-3xl md:text-4xl">Book a session</h1>
        <p className="mb-10 text-sm leading-relaxed text-foreground-muted">
          Share the details you have and Anselm will reply with a tailored quote.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <details open className="group border border-border/50 px-5">
            <SectionHeader title="About you" subtitle="Contact details" />
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name?.message}>
                <input {...register("name")} placeholder="Sarah Tan" className={inputClassName} />
              </Field>
              <Field label="Email address" required error={errors.email?.message}>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="sarah@email.com"
                  className={inputClassName}
                />
              </Field>
              <Field label="Phone / WhatsApp" error={errors.phone?.message}>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="+65 9123 4567"
                  className={inputClassName}
                />
              </Field>
              <Field label="How did you hear about us?" error={errors.referral?.message}>
                <select {...register("referral")} className={selectClassName}>
                  <option value="">Select...</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Referral">Referral</option>
                  <option value="Google">Google</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
          </details>

          <details open className="group border border-border/50 px-5">
            <SectionHeader title="Your event" subtitle="Date, venue, details" />
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <Field label="Event title / name" required error={errors.eventTitle?.message}>
                <input
                  {...register("eventTitle")}
                  placeholder="Luna's 4th Birthday"
                  className={inputClassName}
                />
              </Field>
              <Field label="Event type" required error={errors.eventType?.message}>
                <select {...register("eventType")} className={selectClassName}>
                  <option value="">Select...</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Portraits">Portraits</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Event date" required error={errors.eventDate?.message}>
                <input {...register("eventDate")} type="date" className={inputClassName} />
              </Field>
              <Field
                label="Time"
                required
                error={errors.startTime?.message ?? errors.endTime?.message}
              >
                <div className="flex items-center gap-2">
                  <input {...register("startTime")} type="time" className={inputClassName} />
                  <span className="shrink-0 text-foreground-muted">to</span>
                  <input {...register("endTime")} type="time" className={inputClassName} />
                </div>
              </Field>
              <Field label="Venue name" required error={errors.venue?.message}>
                <input
                  {...register("venue")}
                  placeholder="The Westin Singapore"
                  className={inputClassName}
                />
              </Field>
              <Field label="Venue address" error={errors.venueAddress?.message}>
                <textarea
                  {...register("venueAddress")}
                  rows={2}
                  placeholder="Full address"
                  className={inputClassName}
                />
              </Field>
            </div>
          </details>

          <details open className="group border border-border/50 px-5">
            <SectionHeader title="Services" subtitle="Coverage and delivery" />
            <div className="grid gap-4 pb-5 sm:grid-cols-2">
              <Field label="Services wanted" required error={errors.services?.message}>
                <select {...register("services")} className={selectClassName}>
                  <option value="">Select...</option>
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="both">Both</option>
                </select>
              </Field>
              <Field label="Estimated duration" required error={errors.duration?.message}>
                <select {...register("duration")} className={selectClassName}>
                  <option value="">Select...</option>
                  <option value="1h">1 hour</option>
                  <option value="2h">2 hours</option>
                  <option value="3h">3 hours</option>
                  <option value="4h">4 hours</option>
                  <option value="half-day">Half day</option>
                  <option value="full-day">Full day</option>
                </select>
              </Field>
              <Field label="Number of guests" error={errors.guestCount?.message}>
                <input
                  {...register("guestCount")}
                  type="number"
                  min={0}
                  placeholder="50"
                  className={inputClassName}
                />
              </Field>
              <Field label="Budget range (SGD)" error={errors.budget?.message}>
                <select {...register("budget")} className={selectClassName}>
                  <option value="">Select...</option>
                  <option value="$0-300">$0-300</option>
                  <option value="$300-600">$300-600</option>
                  <option value="$600-1000">$600-1,000</option>
                  <option value="$1000+">$1,000+</option>
                </select>
              </Field>
              <Field label="Deliverables needed" error={errors.deliverables?.message}>
                <select {...register("deliverables")} className={selectClassName}>
                  <option value="">Select...</option>
                  <option value="photos">Edited photos</option>
                  <option value="reel">Highlight reel</option>
                  <option value="both">Both</option>
                  <option value="raw">Raw files</option>
                </select>
              </Field>
              <Field label="Turnaround preference" error={errors.turnaround?.message}>
                <select {...register("turnaround")} className={selectClassName}>
                  <option value="standard">Standard (14 days)</option>
                  <option value="rush">Rush (7 days, +30%)</option>
                </select>
              </Field>
            </div>
          </details>

          <details open className="group border border-border/50 px-5">
            <SectionHeader title="Anything else?" subtitle="Notes and preferences" />
            <div className="flex flex-col gap-4 pb-5">
              <Field label="Special requests" error={errors.specialRequests?.message}>
                <textarea
                  {...register("specialRequests")}
                  rows={4}
                  placeholder="Mood references, shot lists, access notes, specific moments to capture..."
                  className={inputClassName}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Returning client" error={errors.returningClient?.message}>
                  <label className="flex cursor-pointer items-center gap-2 pt-2 text-sm">
                    <input
                      type="checkbox"
                      {...register("returningClient")}
                      className="h-4 w-4 accent-foreground"
                    />
                    Yes, we have worked together before
                  </label>
                </Field>
                <Field label="Preferred contact method" error={errors.preferredContact?.message}>
                  <div className="flex gap-5 pt-2">
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
                </Field>
              </div>
            </div>
          </details>

          {submitError && <p className="text-sm text-red-400">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 inline-flex justify-center rounded-full border border-foreground/20 px-8 py-3 text-sm transition-all duration-300 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send enquiry"}
          </button>
        </form>
      </main>
    </>
  );
}
