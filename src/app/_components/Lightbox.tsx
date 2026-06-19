"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AutoVideo } from "./AutoVideo";
import type { Photo, VideoClip } from "@/lib/media";

export type LightboxItem =
  | ({ kind: "photo" } & Photo)
  | ({ kind: "video" } & VideoClip);

export const asPhotoItems = (photos: Photo[]): LightboxItem[] =>
  photos.map((p) => ({ kind: "photo", ...p }));

interface LightboxProps {
  items: LightboxItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onGoToIndex: (index: number) => void;
}

export function Lightbox({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onGoToIndex,
}: LightboxProps) {
  const current = items[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate("prev");
      if (e.key === "ArrowRight") onNavigate("next");
    },
    [isOpen, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !current) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-20 p-3 text-white/60 transition-colors hover:text-white"
        aria-label="Close"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute top-6 left-6 z-20 text-sm font-light text-white/50">
        {currentIndex + 1} / {items.length}
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("prev");
            }}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 p-4 text-white/50 transition-colors hover:text-white md:left-8"
            aria-label="Previous"
          >
            <svg className="h-8 w-8 md:h-10 md:w-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("next");
            }}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 p-4 text-white/50 transition-colors hover:text-white md:right-8"
            aria-label="Next"
          >
            <svg className="h-8 w-8 md:h-10 md:w-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      <div
        className="relative flex max-h-[85vh] max-w-[92vw] flex-col items-center px-4 md:px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {current.kind === "photo" ? (
          <picture>
            <source srcSet={current.avif} type="image/avif" />
            <source srcSet={current.webp} type="image/webp" />
            <img
              src={current.src}
              alt={current.alt}
              className="max-h-[78vh] max-w-full object-contain animate-scaleIn"
            />
          </picture>
        ) : (
          <div className="w-[min(92vw,1100px)] overflow-hidden rounded-sm animate-scaleIn">
            <AutoVideo video={current} controls priority />
          </div>
        )}

        <div className="mt-6 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
            {current.kind === "photo" ? current.alt : current.title}
          </span>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
