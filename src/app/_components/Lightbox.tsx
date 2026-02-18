"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { type Photo, categories } from "@/lib/photos";

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onGoToIndex: (index: number) => void;
}

export function Lightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onGoToIndex,
}: LightboxProps) {
  const currentPhoto = photos[currentIndex];

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onNavigate("prev");
          break;
        case "ArrowRight":
          onNavigate("next");
          break;
      }
    },
    [isOpen, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 text-white/60 hover:text-white transition-colors z-20"
        aria-label="Close"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-6 left-6 text-white/50 text-sm font-light z-20">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("prev");
            }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors z-20"
            aria-label="Previous"
          >
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("next");
            }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors z-20"
            aria-label="Next"
          >
            <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Main Image */}
      <div
        className="relative max-w-[90vw] max-h-[80vh] flex flex-col items-center px-16"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.src}
          alt={currentPhoto.alt}
          className="max-w-full max-h-[70vh] object-contain animate-scaleIn"
        />

        {/* Caption */}
        <div className="mt-6 text-center">
          {currentPhoto.caption && (
            <p className="font-serif text-xl text-white/90 mb-2">
              {currentPhoto.caption}
            </p>
          )}
          <span className="text-white/40 text-xs uppercase tracking-[0.2em]">
            {categories.find(c => c.id === currentPhoto.category)?.label}
          </span>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-[85vw] overflow-x-auto px-4 py-2 scrollbar-none">
          {photos.map((photo, index) => (
            <button
              key={`thumb-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                onGoToIndex(index);
              }}
              className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 overflow-hidden transition-all duration-300 ${
                index === currentIndex
                  ? "ring-2 ring-white opacity-100"
                  : "opacity-30 hover:opacity-60 grayscale hover:grayscale-0"
              }`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(lightboxContent, document.body);
  }

  return null;
}
