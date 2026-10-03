"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigation } from "@/app/_components/Navigation";
import { StarIcon } from "@/app/_components/Stars";
import { SuccessCheck } from "@/app/_components/SuccessCheck";
import { SHOOT_TYPES, feedbackSchema, type FeedbackFormInput, type FeedbackFormValues } from "@/lib/feedback-schema";
import { cn } from "@/lib/utils";

const RATING_WORDS = ["", "Not great", "Okay", "Good", "Great", "Loved it"];
const MAX_MESSAGE = 1000;

const inputClassName =
  "w-full rounded-sm border border-border/60 bg-background/60 px-4 py-3 text-[15px] text-foreground placeholder:text-foreground-muted/75 transition-colors focus:border-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20";

function Step({ n, title, hint, error, children }: { n: number; title: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border/60 pt-6">
      <legend className="contents">
        <span className="flex items-baseline gap-3">
          <span className="font-serif text-sm text-foreground-muted">0{n}</span>
          <span className="font-serif text-xl">{title}</span>
        </span>
      </legend>
      {hint && <p className="mt-1 text-sm text-foreground-muted sm:pl-8">{hint}</p>}
      <div className="mt-4 sm:pl-8">{children}</div>
      {error && <p className="mt-2 text-xs text-red-400 sm:pl-8" role="alert">{error}</p>}
    </fieldset>
  );
}

export default function NewFeedbackPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sentName, setSentName] = useState<string | null>(null);
  const [hover, setHover] = useState(0);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormInput, unknown, FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { name: "", message: "", website: "" },
  });

  const rating = Number(watch("rating") ?? 0);
  const shootType = watch("shootType");
  const messageLength = (watch("message") ?? "").length;
  const shownRating = hover || rating;

  async function onSubmit(data: FeedbackFormValues) {
    setSubmitError(null);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => null);
    if (res?.ok) {
      setSentName(data.name.split(" ")[0] ?? data.name);
      window.scrollTo({ top: 0 });
      return;
    }
    setSubmitError(
      res?.status === 429
        ? "Lots of notes coming in right now. Please try again in a minute."
        : "Your note couldn't be sent. Please try again, or email anselmpius@gmail.com."
    );
  }

  if (sentName) {
    return (
      <>
        <Navigation variant="solid" />
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <SuccessCheck />
          <p className="mb-4 text-xs uppercase tracking-[0.4em] text-foreground-muted">Received</p>
          <h1 className="mb-3 font-serif text-3xl md:text-4xl">Thank you, {sentName}.</h1>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-foreground-muted">
            This genuinely makes Anselm&apos;s day. Your note will appear on the kind words page once he&apos;s had a read.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/feedback" className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background transition-opacity hover:opacity-80">
              Read other notes
            </Link>
            <Link href="/" className="rounded-full border border-foreground/20 px-6 py-2.5 text-sm transition-all duration-300 hover:bg-foreground hover:text-background">
              Back to portfolio
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation variant="solid" />
      <main className="mx-auto max-w-2xl px-6 pt-32 pb-24 md:px-12">
        <div className="animate-fadeInUp">
          <p className="mb-4 text-xs uppercase tracking-[0.4em] text-foreground-muted">Leave a note</p>
          <h1 className="mb-3 text-balance font-serif text-3xl leading-tight md:text-5xl">Thanks for shooting with me.</h1>
          <p className="mb-12 text-sm leading-relaxed text-pretty text-foreground-muted">
            A few words about how it went helps the next person decide — and I read every one. Takes about a minute.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-10" noValidate>
          <Step n={1} title="How was it?" error={errors.rating?.message}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2" onMouseLeave={() => setHover(0)}>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    onMouseEnter={() => setHover(n)}
                    className={cn(
                      "cursor-pointer p-0.5 transition-transform duration-150 hover:scale-110 has-[:focus-visible]:rounded-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/50",
                      n <= shownRating ? "text-accent" : "text-foreground-muted/70"
                    )}
                  >
                    <input type="radio" value={n} {...register("rating")} className="sr-only" aria-label={`${n} star${n > 1 ? "s" : ""}`} />
                    <StarIcon filled={n <= shownRating} className="h-9 w-9" />
                  </label>
                ))}
              </div>
              <span className="min-w-20 text-sm text-foreground-muted" aria-live="polite">{RATING_WORDS[shownRating]}</span>
            </div>
          </Step>

          <Step n={2} title="What did we shoot?" error={errors.shootType?.message}>
            <div className="flex flex-wrap gap-2">
              {SHOOT_TYPES.map((type) => (
                <label
                  key={type}
                  className={cn(
                    "cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/50",
                    shootType === type
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground-muted hover:border-foreground/40 hover:text-foreground"
                  )}
                >
                  <input type="radio" value={type} {...register("shootType")} className="sr-only" />
                  {type}
                </label>
              ))}
            </div>
          </Step>

          <Step n={3} title="In your own words" hint="What was the day like? How did the photos land?" error={errors.message?.message}>
            <textarea
              {...register("message")}
              rows={6}
              maxLength={MAX_MESSAGE}
              placeholder="Anselm made everyone feel relaxed, and the photos came back within a week…"
              className={cn(inputClassName, "resize-y leading-relaxed")}
            />
            <p className={cn("mt-1 text-right text-xs", messageLength > MAX_MESSAGE * 0.9 ? "text-foreground" : "text-foreground-muted")}>
              {messageLength} / {MAX_MESSAGE}
            </p>
          </Step>

          <Step n={4} title="Who's it from?" hint="Shown publicly — a first name or initials is perfect." error={errors.name?.message}>
            <input {...register("name")} autoComplete="given-name" placeholder="Sarah T." className={inputClassName} />
          </Step>

          {/* Honeypot, hidden from people and assistive tech. */}
          <input {...register("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />

          <div className="flex flex-col gap-3 border-t border-border/60 pt-8">
            {submitError && <p className="text-sm text-red-400" role="alert">{submitError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-full bg-foreground px-8 py-3 text-sm text-background transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sending…" : "Send note"}
            </button>
            <p className="text-center text-xs text-foreground-muted">
              Notes are read by Anselm before they appear on the <Link href="/feedback" className="underline underline-offset-2">kind words</Link> page.
            </p>
          </div>
        </form>
      </main>
    </>
  );
}
