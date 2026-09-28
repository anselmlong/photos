"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavigationProps {
  /**
   * "overlay" floats transparently over a hero, then gains the solid backing once
   * the hero has scrolled away; "solid" is always a backed bar.
   */
  variant?: "solid" | "overlay";
}

const focusRing =
  "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

/** True once the page has scrolled far enough that the bar is no longer over the full-height hero. */
function usePastHero(enabled: boolean) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // The hero is 100svh; switch as the bar's lower edge reaches its bottom.
      setPast(window.scrollY > window.innerHeight - 96);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled]);

  return past;
}

export function Navigation({ variant = "solid" }: NavigationProps) {
  const pastHero = usePastHero(variant === "overlay");
  const overlay = variant === "overlay" && !pastHero;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b bg-origin-border transition-[background-color,border-color] duration-500",
        overlay
          ? "border-transparent bg-transparent bg-gradient-to-b from-black/40 to-transparent"
          : "border-border/50 bg-background/80 backdrop-blur-md"
      )}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 md:px-12">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            href="/"
            className={cn(
              "whitespace-nowrap font-serif text-lg tracking-tight transition-opacity hover:opacity-70 sm:text-xl md:text-2xl",
              focusRing,
              overlay && "text-white"
            )}
          >
            Anselm Long
          </Link>

          <div className={cn("flex items-center gap-4 whitespace-nowrap sm:gap-5 md:gap-6", overlay && "text-white")}>
            <a
              href="https://anselmlong.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "hidden text-sm transition-colors sm:block",
                focusRing,
                overlay ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
              )}
            >
              anselmlong.com ↗
            </a>

            <Link
              href="/feedback"
              className={cn(
                "text-sm transition-colors",
                focusRing,
                overlay ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
              )}
            >
              Kind words
            </Link>

            <Link
              href="/booking"
              className={cn(
                "text-sm transition-colors",
                focusRing,
                overlay ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
              )}
            >
              {/* "Book a session" won't share a 360px row with the name, so phones get the short form. */}
              Book<span className="hidden sm:inline"> a session</span>
            </Link>

            <a
              href="mailto:anselmpius@gmail.com"
              className={cn(
                "hidden items-center rounded-full border px-4 py-2 text-sm transition-all duration-300 md:inline-flex",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                overlay
                  ? "border-white/30 hover:bg-white hover:text-black"
                  : "border-foreground/20 hover:bg-foreground hover:text-background"
              )}
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
