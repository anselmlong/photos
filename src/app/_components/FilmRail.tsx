"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AutoVideo } from "./AutoVideo";
import { lightboxKey } from "./Lightbox";
import { cn } from "@/lib/utils";
import type { VideoClip } from "@/lib/media";

interface FilmRailProps {
  films: VideoClip[];
  onOpen: (slug: string) => void;
}

/**
 * Horizontal rail of ambient film clips. Touch swipes it natively; the arrows,
 * edge fades and progress line make it reachable (and legible) with a mouse,
 * where the hidden scrollbar would otherwise leave films stranded off-screen.
 */
export function FilmRail({ films, onOpen }: FilmRailProps) {
  const rail = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  // Track position without re-rendering per scroll frame: the thumb is moved
  // directly, and state only changes when an end is reached or left.
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      const start = el.scrollLeft <= 2;
      const end = el.scrollLeft >= max - 2;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
      if (thumb.current) {
        const size = max > 0 ? el.clientWidth / el.scrollWidth : 1;
        const progress = max > 0 ? el.scrollLeft / max : 0;
        thumb.current.style.width = `${size * 100}%`;
        thumb.current.style.transform = `translateX(${(progress * (1 - size) * 100) / size}%)`;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    el.addEventListener("scroll", schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", schedule);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // One film per press; snap-center settles it in the middle.
  const step = useCallback((direction: 1 | -1) => {
    const el = rail.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  }, []);

  // aria-disabled rather than disabled: a keyboard user who presses through to
  // the end keeps focus on the arrow instead of losing it to the page.
  const arrow =
    "flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 transition-all duration-300 " +
    "hover:bg-foreground hover:text-background aria-disabled:pointer-events-none aria-disabled:opacity-30 " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <section aria-labelledby="films-heading" className="reveal py-12 md:py-16">
      <div className="mb-8 flex items-end justify-between gap-6 px-6 md:px-12">
        <div>
          <h2 id="films-heading" className="font-serif text-3xl md:text-5xl">
            Films
          </h2>
          <p className="mt-3 max-w-md text-foreground-muted">Motion work, in selected frames.</p>
        </div>
        <div className="hidden flex-shrink-0 gap-2 sm:flex">
          <button type="button" onClick={() => step(-1)} aria-disabled={edges.start} aria-label="Previous films" className={arrow}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-disabled={edges.end} aria-label="More films" className={arrow}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <div ref={rail} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:px-12">
          {films.map((v) => (
            <button
              key={v.slug}
              type="button"
              data-lightbox-key={lightboxKey({ kind: "video", ...v })}
              onClick={() => onOpen(v.slug)}
              aria-label={`Play ${v.title}`}
              className={cn(
                "group relative aspect-video w-[85vw] flex-shrink-0 snap-center overflow-hidden rounded-sm md:w-[60vw] lg:w-[44vw]",
                // Closing the lightbox on a film scrolls it back into view clear of the fixed nav.
                "scroll-mt-24 scroll-mb-6",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              )}
            >
              <AutoVideo video={v} />
              <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0" />
              <span className="absolute bottom-4 left-4 font-serif text-lg text-white drop-shadow">{v.title}</span>
            </button>
          ))}
        </div>

        {/* Edge fades: a hint that there is more rail on that side. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-500 md:w-16",
            edges.start ? "opacity-0" : "opacity-100"
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity duration-500 md:w-16",
            edges.end ? "opacity-0" : "opacity-100"
          )}
        />
      </div>

      {/* Stands in for the hidden scrollbar: how much of the reel you've seen. */}
      <div aria-hidden="true" className="mx-6 mt-2 h-px overflow-hidden bg-border md:mx-12">
        <div ref={thumb} className="h-full w-1/3 bg-foreground/60" />
      </div>
    </section>
  );
}
