import Link from "next/link";
import { type Metadata } from "next";
import { Navigation } from "@/app/_components/Navigation";
import { Stars } from "@/app/_components/Stars";
import { getRedis } from "@/lib/chat-store";
import { type Testimonial } from "@/lib/feedback-schema";
import { listApproved } from "@/lib/feedback-store";
import { CAROUSELL_PROFILE_URL, carousellTestimonials } from "@/lib/testimonials-seed";
import { TestimonialWall } from "./TestimonialWall";

export const metadata: Metadata = {
  title: "Kind words — Anselm Long Photography",
  description: "What clients say about working with Anselm Long.",
};

// Newly approved notes also revalidate this page on approval.
export const revalidate = 300;

async function loadTestimonials(): Promise<Testimonial[]> {
  const redis = getRedis();
  let approved: Testimonial[] = [];
  if (redis) {
    try { approved = await listApproved(redis); }
    catch (error) { console.error("Could not load approved feedback:", error); }
  }
  return [...approved, ...carousellTestimonials].sort((a, b) => b.date.localeCompare(a.date));
}

export default async function FeedbackPage() {
  const testimonials = await loadTestimonials();
  const count = testimonials.length;
  const average = count ? testimonials.reduce((sum, t) => sum + t.rating, 0) / count : 0;
  const fromCarousell = testimonials.filter((t) => t.source === "carousell").length;
  // Lead with the longest recent five-star note as a pull quote.
  const featured = testimonials
    .slice(0, 12)
    .filter((t) => t.rating === 5)
    .sort((a, b) => b.message.length - a.message.length)[0];

  return (
    <>
      <Navigation variant="solid" />
      <main className="mx-auto max-w-7xl px-6 pt-32 pb-24 md:px-12">
        <header className="mb-14 grid gap-10 md:mb-20 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div className="animate-fadeInUp">
            <p className="mb-4 text-xs uppercase tracking-[0.4em] text-foreground-muted">Kind words</p>
            <h1 className="text-balance font-serif text-4xl leading-[1.05] md:text-6xl">
              What people say after the shoot.
            </h1>
          </div>
          <div className="animate-fadeInUp flex flex-col gap-5 md:items-end md:text-right">
            {count > 0 && (
              <div className="flex items-center gap-4 md:flex-row-reverse">
                <span className="font-serif text-5xl leading-none">{average.toFixed(1)}</span>
                <span className="flex flex-col gap-1">
                  <Stars rating={average} />
                  <span className="text-xs text-foreground-muted">
                    from {count} {count === 1 ? "client" : "clients"}
                    {fromCarousell > 0 && (
                      <>
                        {" · "}
                        <a href={CAROUSELL_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                          {fromCarousell} on Carousell ↗
                        </a>
                      </>
                    )}
                  </span>
                </span>
              </div>
            )}
            <Link
              href="/feedback/new"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-foreground/20 px-6 py-2.5 text-sm transition-all duration-300 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Worked with Anselm? Leave a note →
            </Link>
          </div>
        </header>

        {count === 0 ? (
          <div className="border border-dashed border-border px-6 py-20 text-center">
            <p className="font-serif text-2xl">No notes yet.</p>
            <p className="mt-2 text-sm text-foreground-muted">If we&apos;ve worked together, you could be the first.</p>
          </div>
        ) : (
          <>
            {featured && (
              <figure className="animate-fadeInUp mb-16 border-y border-border/60 py-12 md:mb-20 md:py-16">
                <span aria-hidden="true" className="block font-serif text-7xl leading-none text-accent/60">“</span>
                {/* Set in Playfair's true italic, the voice the hero's "Long" uses, so the lead note reads as quoted speech. */}
                <blockquote className="-mt-4 max-w-4xl whitespace-pre-line text-pretty font-serif text-2xl italic leading-snug md:text-3xl">
                  {featured.message}
                </blockquote>
                <figcaption className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-muted">
                  <Stars rating={featured.rating} />
                  <span className="text-foreground">{featured.name}</span>
                  <span>{featured.shootType}</span>
                  {featured.source === "carousell" && <span className="text-xs uppercase tracking-[0.2em]">via Carousell</span>}
                </figcaption>
              </figure>
            )}
            {(!featured || count > 1) && <TestimonialWall testimonials={testimonials} featuredId={featured?.id} />}
          </>
        )}
      </main>
    </>
  );
}
