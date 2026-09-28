import { cn } from "@/lib/utils";

export function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={cn("h-4 w-4", className)}>
      <path
        d="M10 1.8l2.47 5.2 5.7.72-4.2 3.93 1.08 5.64L10 14.53l-5.05 2.76 1.08-5.64-4.2-3.93 5.7-.72z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5 text-accent", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= Math.round(rating)} />
      ))}
    </span>
  );
}
