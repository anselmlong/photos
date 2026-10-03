"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavigationProps {
  /** "overlay" floats transparently over a hero; "solid" is a backed bar. */
  variant?: "solid" | "overlay";
}

export function Navigation({ variant = "solid" }: NavigationProps) {
  const pathname = usePathname();
  // Past the hero, the overlay bar would float its links straight over body copy;
  // it picks up the same backing as the solid bar instead.
  const [backed, setBacked] = useState(false);
  useEffect(() => {
    if (variant !== "overlay") return;
    const update = () => setBacked(window.scrollY > window.innerHeight - 96);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [variant]);

  // The page you're on reads as lit, not as another option.
  const link = (href: string) => {
    const current = pathname === href || pathname.startsWith(`${href}/`);
    return {
      "aria-current": current ? ("page" as const) : undefined,
      className: cn(
        "-my-2 py-3 text-sm transition-colors",
        current
          ? variant === "overlay" ? "text-white" : "text-foreground"
          : variant === "overlay" ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
      ),
    };
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors",
        variant === "solid"
          ? "border-b border-border/50 bg-background/80 backdrop-blur-md"
          : "bg-gradient-to-b from-black/40 to-transparent"
      )}
    >
      {variant === "overlay" && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 -z-10 border-b border-border/50 bg-background/85 backdrop-blur-md transition-opacity duration-500",
            backed ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link
            href="/"
            className={cn(
              "font-serif text-xl tracking-tight transition-opacity hover:opacity-70 md:text-2xl",
              variant === "overlay" && "text-white"
            )}
          >
            Anselm Long
          </Link>

          <div className={cn("flex items-center gap-5 md:gap-6", variant === "overlay" && "text-white")}>
            <a
              href="https://anselmlong.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "-my-2 hidden py-3 text-sm transition-colors sm:block",
                variant === "overlay" ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
              )}
            >
              anselmlong.com ↗
            </a>

            <Link href="/feedback" {...link("/feedback")}>
              Kind words
            </Link>

            <Link href="/booking" {...link("/booking")}>
              Book a session
            </Link>

            <a
              href="mailto:anselmpius@gmail.com"
              className={cn(
                "hidden items-center rounded-full border px-4 py-2 text-sm transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:inline-flex",
                variant === "overlay"
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
