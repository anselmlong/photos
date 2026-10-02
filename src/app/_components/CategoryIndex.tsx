"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CategoryIndexProps {
  categories: { id: string; label: string; count: number }[];
}

/**
 * Sticky contents strip for the gallery: jumps to a category and marks the
 * one currently on screen. Plain anchors, so #sports etc. are shareable links.
 */
export function CategoryIndex({ categories }: CategoryIndexProps) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  // Deep links (e.g. /#sports from an Instagram bio): the browser's own smooth
  // jump gets cut short while the page hydrates, so land on the section directly.
  useEffect(() => {
    const target = categories.find((c) => `#${c.id}` === window.location.hash);
    if (!target) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(target.id)?.scrollIntoView({ block: "start", behavior: "instant" })
    );
    return () => cancelAnimationFrame(frame);
  }, [categories]);

  // Scrollspy: a section is "current" while it crosses the middle band of the viewport.
  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
        // Back above the first category (e.g. on the films): nothing is current.
        if (sections[0].getBoundingClientRect().top > window.innerHeight * 0.4) setActive(null);
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  // Keep the current chip in view on narrow screens without scrolling the page.
  useEffect(() => {
    const el = rail.current;
    const chip = active ? el?.querySelector<HTMLElement>(`[data-id="${active}"]`) : null;
    if (!el || !chip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({
      left: chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <nav
      aria-label="Photo categories"
      className={cn(
        "sticky top-16 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md md:top-20",
        // Back the transparent overlay nav too, so photos don't slide between it and the strip.
        "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-16 before:bg-background/85 before:backdrop-blur-md md:before:h-20"
      )}
    >
      {/* Inset + chip padding puts each label on the same edge as the section headings. */}
      <div ref={rail} className="no-scrollbar flex gap-1 overflow-x-auto px-2.5 py-2.5 md:px-8.5">
        {categories.map((c) => {
          const current = c.id === active;
          return (
            <a
              key={c.id}
              href={`#${c.id}`}
              data-id={c.id}
              aria-current={current ? "location" : undefined}
              className={cn(
                "flex flex-shrink-0 items-baseline gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-300",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                current ? "bg-foreground text-background" : "text-foreground/80 hover:text-foreground"
              )}
            >
              {c.label}
              <span className={cn("text-xs tabular-nums", current ? "text-background/70" : "text-foreground/60")}>
                {c.count}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
