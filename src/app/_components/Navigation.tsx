"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface NavigationProps {
  /** "overlay" floats transparently over a hero (e.g. cinematic); "solid" is the default bar. */
  variant?: "solid" | "overlay";
  /** Back-to-chooser link shown while previewing variants. */
  showBackToVariants?: boolean;
}

export function Navigation({ variant = "solid", showBackToVariants }: NavigationProps) {
  const { theme, toggleTheme } = useTheme();

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
            {showBackToVariants && (
              <Link
                href="/"
                className={cn(
                  "hidden text-sm transition-colors sm:block",
                  variant === "overlay" ? "text-white/70 hover:text-white" : "text-foreground-muted hover:text-foreground"
                )}
              >
                ← All versions
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className={cn(
                "rounded-full p-2 transition-colors",
                variant === "overlay" ? "hover:bg-white/10" : "hover:bg-muted"
              )}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </button>

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
