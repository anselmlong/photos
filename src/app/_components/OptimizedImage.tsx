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
 * with a blur-up placeholder painted behind until the full image decodes.
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
        className={cn(
          "transition-opacity duration-700 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        style={{
          backgroundImage: `url(${photo.blurDataURL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </picture>
  );
}
