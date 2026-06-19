"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Navigation } from "./_components/Navigation";
import { AutoVideo } from "./_components/AutoVideo";
import { OptimizedImage } from "./_components/OptimizedImage";
import { Lightbox, asPhotoItems, type LightboxItem } from "./_components/Lightbox";
import { useLightbox } from "./_components/useLightbox";
import { TelegramChat } from "./_components/TelegramChat";
import { photos, videos, categories } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Home() {
  const root = useRef<HTMLDivElement>(null);

  const heroVideo = videos.find((v) => v.slug === "legacy-cropped") ?? videos[0];
  const restVideos = videos.filter((v) => v.slug !== heroVideo?.slug);

  const items: LightboxItem[] = [
    ...videos.map((v) => ({ kind: "video" as const, ...v })),
    ...asPhotoItems(photos),
  ];
  const lb = useLightbox(items);
  const photoIndex = (slug: string) => videos.length + photos.findIndex((p) => p.slug === slug);

  useGSAP(
    () => {
      gsap.from(".hero-line", {
        yPercent: 120,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "power4.out",
        delay: 0.2,
      });

      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      ScrollTrigger.batch(".tile", {
        start: "top 92%",
        onEnter: (els) =>
          gsap.from(els, {
            opacity: 0,
            y: 40,
            scale: 0.96,
            duration: 0.6,
            stagger: 0.06,
            ease: "power3.out",
            overwrite: true,
          }),
      });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".hero-content", {
          yPercent: 30,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-media", {
          scale: 1.2,
          ease: "none",
          scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="min-h-screen bg-background text-foreground">
      <Navigation variant="overlay" />

      {/* HERO */}
      <section className="hero-section relative h-[100svh] w-full overflow-hidden">
        {heroVideo && <AutoVideo video={heroVideo} priority className="hero-media absolute inset-0" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
        <div className="hero-content absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <div className="overflow-hidden">
            <p className="hero-line text-xs uppercase tracking-[0.5em] text-white/70 md:text-sm">
              Photography &amp; Motion
            </p>
          </div>
          <h1 className="mt-4 font-serif text-[15vw] leading-[0.9] md:text-[11vw] lg:text-[9rem]">
            <span className="block overflow-hidden">
              <span className="hero-line block">Anselm</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-line block italic">Long</span>
            </span>
          </h1>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60">
          <svg className="h-6 w-6 animate-bounce" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* ABOUT — moved near the top */}
      <section className="reveal mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <p className="mb-6 text-xs uppercase tracking-[0.4em] text-foreground-muted">About</p>
        <p className="font-serif text-2xl leading-relaxed text-balance md:text-3xl">
          I&apos;m Anselm — based in Singapore, studying computer science at NUS and working at the
          intersection of design and engineering. But I&apos;m happiest behind a camera. This is a
          collection of the moments I&apos;ve chased: portraits, weddings, events, and the occasional film.
        </p>
      </section>

      {/* FILMS — horizontal rail */}
      <section className="reveal py-12 md:py-16">
        <div className="mb-8 px-6 md:px-12">
          <h2 className="font-serif text-3xl md:text-5xl">Films</h2>
          <p className="mt-3 max-w-md text-foreground-muted">Motion work, in selected frames.</p>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:px-12">
          {restVideos.map((v) => {
            const idx = videos.findIndex((x) => x.slug === v.slug);
            return (
              <button
                key={v.slug}
                onClick={() => lb.open(idx)}
                className="group relative aspect-video w-[85vw] flex-shrink-0 snap-center overflow-hidden rounded-sm md:w-[60vw] lg:w-[44vw]"
              >
                <AutoVideo video={v} />
                <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0" />
                <span className="absolute bottom-4 left-4 font-serif text-lg text-white drop-shadow">
                  {v.title}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* PHOTOS — grouped by category, full uncropped frames */}
      {categories.map((cat) => {
        const catPhotos = photos.filter((p) => p.category === cat.id);
        if (catPhotos.length === 0) return null;
        return (
          <section key={cat.id} className="px-6 py-12 md:px-12 md:py-16">
            <h2 className="reveal mb-8 flex items-baseline gap-3 font-serif text-3xl md:text-5xl">
              {cat.label}
              <span className="text-base text-foreground-muted">{catPhotos.length}</span>
            </h2>
            <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>*]:mb-3">
              {catPhotos.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => lb.open(photoIndex(p.slug))}
                  className="tile group relative block w-full break-inside-avoid overflow-hidden rounded-sm"
                >
                  <OptimizedImage
                    photo={p}
                    className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-3 left-3 flex translate-y-1 items-center gap-1.5 text-[11px] uppercase tracking-widest text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25h-4.5m4.5 0v4.5m0-4.5L15 9m-6 6l-5.25 5.25m0 0v-4.5m0 4.5h4.5M15 15l5.25 5.25m0 0v-4.5m0 4.5h-4.5" />
                    </svg>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <Footer />
      <TelegramChat />

      <Lightbox
        items={items}
        currentIndex={lb.index}
        isOpen={lb.isOpen}
        onClose={lb.close}
        onNavigate={lb.navigate}
        onGoToIndex={lb.goToIndex}
      />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-16 text-center md:px-12">
      <h2 className="font-serif text-3xl md:text-4xl">Let&apos;s create something.</h2>
      <a
        href="mailto:anselmpius@gmail.com"
        className="mt-6 inline-flex items-center gap-2 border-b border-foreground pb-1 text-lg transition-opacity hover:opacity-70"
      >
        anselmpius@gmail.com
      </a>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-foreground-muted">
        <a href="https://instagram.com/selmshoots" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
          Instagram
        </a>
        <a href="https://anselmlong.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
          Portfolio
        </a>
        <a href="https://linkedin.com/in/anselmlong" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
          LinkedIn
        </a>
        <a href="https://github.com/anselmlong" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
          GitHub
        </a>
      </div>
      <p className="mt-12 text-xs uppercase tracking-[0.2em] text-foreground-muted">
        © {new Date().getFullYear()} Anselm Long
      </p>
    </footer>
  );
}
