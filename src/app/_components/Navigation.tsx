"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavigationProps {
  /**
   * "overlay" floats transparently over a hero, then gains the solid backing once
   * the hero has scrolled away; "solid" is always a backed bar.
   */
  variant?: "solid" | "overlay";
}

// The backing crossfade and the text colours share one timing, so the bar turns over in one move
// (and matches the "Get in Touch" pill).
const fade = "duration-300 motion-reduce:duration-0";

const focusRing =
  "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** True once the page has scrolled far enough that the bar is no longer over the full-height hero. */
function usePastHero(enabled: boolean) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Switch as the bar's lower edge reaches the hero's bottom. Measure the hero itself:
      // it is 100svh, and on phones innerHeight grows once the browser toolbar collapses,
      // which would leave photos under a clear bar for a moment.
      const hero = document.querySelector(".hero-section");
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : window.innerHeight - window.scrollY;
      setPast(heroBottom < 96);
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
  const pathname = usePathname();
  // The page you're on reads as lit, not as another option.
  const link = (href: string) => {
    const current = pathname === href || pathname.startsWith(`${href}/`);
    return {
      "aria-current": current ? ("page" as const) : undefined,
      className: cn(
        "-my-2 py-3 text-sm transition-colors",
        variant === "overlay" && fade,
        focusRing,
        current
          ? overlay ? "text-white" : "text-foreground"
          : overlay ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
      ),
    };
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Gradients and backdrop blur can't be transitioned, so the two backings are layers that crossfade. */}
      {variant === "overlay" && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 to-transparent transition-opacity",
            fade,
            overlay ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 border-b border-border/50 bg-background/80 backdrop-blur-md transition-opacity",
          fade,
          overlay ? "opacity-0" : "opacity-100"
        )}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 md:px-12">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            href="/"
            className={cn(
              "whitespace-nowrap font-serif text-lg tracking-tight transition-[color,opacity] hover:opacity-70 sm:text-xl md:text-2xl",
              variant === "overlay" && fade,
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
                "-my-2 hidden py-3 text-sm transition-colors sm:block",
                variant === "overlay" && fade,
                focusRing,
                overlay ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
              )}
            >
              anselmlong.com ↗
            </a>

            <Link href="/feedback" {...link("/feedback")}>
              Kind words
            </Link>

            <Link href="/booking" {...link("/booking")}>
              {/* "Book a session" won't share a 360px row with the name, so phones get the short form. */}
              Book<span className="hidden sm:inline"> a session</span>
            </Link>

            <a
              href="mailto:anselmpius@gmail.com"
              className={cn(
                "hidden items-center rounded-full border px-4 py-2 text-sm transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:inline-flex",
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
