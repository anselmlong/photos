"use client";

import { useState, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Lightbox } from "./Lightbox";
import { type Photo, type Category, categories } from "@/lib/photos";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface PhotoGalleryProps {
  photos: Photo[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const filteredPhotos = selectedCategory
    ? photos.filter((p) => p.category === selectedCategory)
    : photos;

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const navigateLightbox = useCallback((direction: "prev" | "next") => {
    setLightboxIndex((prev) => {
      if (direction === "prev") {
        return prev === 0 ? filteredPhotos.length - 1 : prev - 1;
      }
      return prev === filteredPhotos.length - 1 ? 0 : prev + 1;
    });
  }, [filteredPhotos.length]);

  const goToIndex = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  // GSAP animations
  useGSAP(
    () => {
      const items = galleryRef.current?.querySelectorAll(".gallery-item");
      if (!items?.length) return;

      gsap.fromTo(
        items,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: galleryRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { dependencies: [filteredPhotos], scope: galleryRef }
  );

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-5 py-2.5 text-sm tracking-wide transition-all duration-300 border rounded-full ${
            selectedCategory === null
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-foreground-muted border-border hover:border-foreground hover:text-foreground"
          }`}
        >
          All Work
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-5 py-2.5 text-sm tracking-wide transition-all duration-300 border rounded-full ${
              selectedCategory === category.id
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-foreground-muted border-border hover:border-foreground hover:text-foreground"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      <div
        ref={galleryRef}
        className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
      >
        {filteredPhotos.map((photo, index) => (
          <div
            key={`${photo.src}-${index}`}
            className="gallery-item break-inside-avoid group cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            <div className="relative overflow-hidden bg-muted">
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-[1.03]"
                loading="lazy"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {photo.caption && (
                    <p className="font-serif text-lg text-white/95 mb-1">
                      {photo.caption}
                    </p>
                  )}
                  <span className="text-xs text-white/60 uppercase tracking-widest">
                    {categories.find(c => c.id === photo.category)?.label}
                  </span>
                </div>
              </div>

              {/* Expand Icon */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-2 bg-black/30 backdrop-blur-sm rounded-full">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                  </svg>
                </div>
              </div>

              {/* Featured Badge */}
              {photo.featured && (
                <div className="absolute top-4 left-4">
                  <span className="px-2 py-1 text-[10px] uppercase tracking-widest bg-accent text-white rounded">
                    Featured
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <div className="text-center py-24">
          <p className="font-serif text-xl text-foreground-muted mb-4">
            No photos in this category yet
          </p>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-accent hover:underline"
          >
            View all photos
          </button>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        photos={filteredPhotos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        onGoToIndex={goToIndex}
      />
    </>
  );
}
