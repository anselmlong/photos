"use client";

import { useMemo, useState } from "react";
import { type Testimonial } from "@/lib/feedback-schema";
import { cn } from "@/lib/utils";
import { TestimonialCard } from "@/app/_components/TestimonialCard";

/** `featuredId` is already shown as the pull quote, so it's hidden from the unfiltered wall. */
export function TestimonialWall({ testimonials, featuredId }: { testimonials: Testimonial[]; featuredId?: string }) {
  const [filter, setFilter] = useState<string>("All");
  const types = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of testimonials) counts.set(t.shootType, (counts.get(t.shootType) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [testimonials]);
  const shown = filter === "All" ? testimonials.filter((t) => t.id !== featuredId) : testimonials.filter((t) => t.shootType === filter);

  return (
    <>
      {types.length > 1 && (
        <div className="no-scrollbar -mx-6 mb-8 flex gap-2 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filter by shoot">
          {[["All", testimonials.length] as const, ...types].map(([label, count]) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(label)}
              aria-pressed={filter === label}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
                filter === label
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground-muted hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {label} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}
      {/* Bottom margins rather than space-y: a top margin would push every column but the first down. */}
      <div key={filter} className="animate-fadeIn gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5">
        {shown.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </div>
    </>
  );
}
