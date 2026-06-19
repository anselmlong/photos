"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { VideoClip } from "@/lib/media";

interface AutoVideoProps {
  video: VideoClip;
  className?: string;
  /** Show native controls (e.g. inside a modal). Default: ambient muted loop. */
  controls?: boolean;
  /** Eager hero clip vs. lazy in-feed. */
  priority?: boolean;
}

/**
 * Ambient autoplay video: muted, looped, plays-inline, poster fallback.
 * Pauses when scrolled out of view (perf) and fully disables autoplay when the
 * user prefers reduced motion — falling back to the poster image.
 */
export function AutoVideo({ video, className, controls = false, priority }: AutoVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || controls) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // leave paused, poster shows

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [controls]);

  return (
    <video
      ref={ref}
      poster={video.poster}
      className={cn("h-full w-full object-cover", className)}
      muted={!controls}
      loop={!controls}
      playsInline
      controls={controls}
      autoPlay={controls}
      preload={priority ? "auto" : "metadata"}
      width={video.width}
      height={video.height}
    >
      <source src={video.clip} type="video/mp4" />
    </video>
  );
}
