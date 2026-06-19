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
import { photos, videos } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Home() {
  const root = useRef<HTMLDivElement>(null);

  // Hero plays the "legacy" clip; the rest fill the film rail.
  const heroVideo = videos.find((v) => v.slug === "legacy-cropped") ?? videos[0];
  const restVideos = videos.filter((v) => v.slug !== heroVideo?.slug);

  // Lightbox spans every clip then every still.
  const items: LightboxItem[] = [
    ...videos.map((v) => ({ kind: "video" as const, ...v })),
    ...asPhotoItems(photos),
  ];
  const lb = useLightbox(items);

  useGSAP(
    () => {
      // Hero intro
      gsap.from(".hero-line", {
        yPercent: 120,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: "power4.out",
        delay: 0.2,
      });

      // Gentle section reveals (kept for reduced-motion too)
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 60,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });

      // Archive: staggered pop-in as tiles enter
      ScrollTrigger.batch(".archive-item", {
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

      // Scroll-driven effects — motion-safe only
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero: content drifts up + fades, video slowly zooms as you scroll past
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

        // Full-bleed stills: parallax drift inside their frames
        gsap.utils.toArray<HTMLElement>(".parallax-img").forEach((img) => {
          gsap.fromTo(
            img,
            { yPercent: -10 },
            {
              yPercent: 10,
              ease: "none",
              scrollTrigger: {
                trigger: img.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="dark min-h-screen bg-background text-foreground">
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

      {/* FEATURED FILMS — horizontal rail */}
      <section className="reveal py-20 md:py-28">
        <div className="mb-10 px-6 md:px-12">
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

      {/* FILM STRIP — alternating full-bleed stills with parallax */}
      <section className="space-y-2 md:space-y-3">
        {photos.slice(0, 6).map((p, i) => (
          <div
            key={p.slug}
            className="relative h-[70svh] w-full cursor-pointer overflow-hidden"
            onClick={() => lb.open(videos.length + i)}
          >
            <OptimizedImage
              photo={p}
              priority={i === 0}
              className="parallax-img absolute inset-x-0 top-[-15%] h-[130%] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100" />
          </div>
        ))}
      </section>

      {/* GRID — the full set */}
      <section className="px-6 py-24 md:px-12 md:py-32">
        <h2 className="reveal mb-10 font-serif text-3xl md:text-5xl">The Archive</h2>
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>*]:mb-3">
          {photos.map((p, i) => (
            <button
              key={p.slug}
              onClick={() => lb.open(videos.length + i)}
              className="archive-item group block w-full break-inside-avoid overflow-hidden rounded-sm"
            >
              <OptimizedImage
                photo={p}
                className="w-full transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </button>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="reveal mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <p className="mb-6 text-xs uppercase tracking-[0.4em] text-foreground-muted">About</p>
        <p className="font-serif text-2xl leading-relaxed text-balance md:text-3xl">
          I&apos;m Anselm — based in Singapore, studying computer science at NUS and working at the
          intersection of design and engineering. But I&apos;m happiest behind a camera. This is a
          collection of the moments I&apos;ve chased: portraits, weddings, events, and the occasional film.
        </p>
      </section>

      <Footer />

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
