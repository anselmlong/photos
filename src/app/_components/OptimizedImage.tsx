"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Photo } from "@/lib/media";

interface OptimizedImageProps {
  photo: Photo;
  className?: string;
  /** Eager-load above-the-fold imagery. */
  priority?: boolean;
  sizes?: string;
}

/**
 * Static, optimizer-free responsive image: AVIF → WebP → JPEG via <picture>,
 * with a softened blur-up placeholder behind it until the full image decodes,
 * then a one-time "develop" from a pale grey print to full colour.
 * Carries intrinsic width/height to eliminate layout shift.
 */
export function OptimizedImage({ photo, className, priority }: OptimizedImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // If the image is already decoded (cache hit) before React attaches onLoad,
  // the event never fires — detect completeness on mount so it doesn't stay hidden.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    // The placeholder lives on its own layer: painted on the <img> it would be
    // hidden by the same opacity-0 that hides the unloaded photo.
    <span className="relative block overflow-hidden bg-muted">
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 scale-110 bg-cover bg-center blur-xl transition-opacity duration-300",
          loaded ? "opacity-0 delay-700" : "opacity-100"
        )}
        style={{ backgroundImage: `url(${photo.blurDataURL})` }}
      />
      <picture>
        <source srcSet={photo.avif} type="image/avif" />
        <source srcSet={photo.webp} type="image/webp" />
        <img
          ref={ref}
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          // A failed load still reveals the frame, so the alt text isn't lost behind the blur.
          onError={() => setLoaded(true)}
          className={cn(
            "relative transition-opacity duration-700 ease-out",
            // Once decoded, the frame comes up like a print in the developer tray.
            loaded ? "develop opacity-100" : "opacity-0",
            className
          )}
        />
      </picture>
    </span>
  );
}
