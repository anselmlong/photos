import { type Testimonial } from "@/lib/feedback-schema";
import { cn } from "@/lib/utils";
import { Stars } from "./Stars";

export function formatReviewDate(date: string) {
  if (/^\d{4}$/.test(date)) return date;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
}

export function TestimonialCard({ testimonial, className }: { testimonial: Testimonial; className?: string }) {
  const { name, shootType, rating, message, date, source } = testimonial;
  return (
    <figure className={cn("flex break-inside-avoid flex-col border border-border/60 bg-card/40 p-6 transition-colors hover:border-foreground/25", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Stars rating={rating} />
        {source === "carousell" && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground-muted">via Carousell</span>
        )}
      </div>
      <blockquote className="flex-1 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{message}</blockquote>
      <figcaption className="mt-5 flex items-baseline justify-between gap-3 border-t border-border/50 pt-4">
        <span className="min-w-0">
          <span className="block truncate font-serif text-base">{name}</span>
          <span className="text-xs text-foreground-muted">{shootType}</span>
        </span>
        <span className="shrink-0 text-xs text-foreground-muted">{formatReviewDate(date)}</span>
      </figcaption>
    </figure>
  );
}
