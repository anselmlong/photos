"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavigationProps {
  /** "overlay" floats transparently over a hero; "solid" is a backed bar. */
  variant?: "solid" | "overlay";
}

export function Navigation({ variant = "solid" }: NavigationProps) {
  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors",
        variant === "solid"
          ? "border-b border-border/50 bg-background/80 backdrop-blur-md"
          : "bg-gradient-to-b from-black/40 to-transparent"
      )}
    >
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
                "hidden text-sm transition-colors sm:block",
                variant === "overlay" ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
              )}
            >
              anselmlong.com ↗
            </a>

            <Link
              href="/booking"
              className={cn(
                "text-sm transition-colors",
                variant === "overlay" ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
              )}
            >
              Book a session
            </Link>

            <a
              href="mailto:anselmpius@gmail.com"
              className={cn(
                "hidden items-center rounded-full border px-4 py-2 text-sm transition-all duration-300 md:inline-flex",
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
