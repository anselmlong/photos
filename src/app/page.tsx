"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Navigation } from "./_components/Navigation";
import { AutoVideo } from "./_components/AutoVideo";
import { OptimizedImage } from "./_components/OptimizedImage";
import { Lightbox, asPhotoItems, type LightboxItem } from "./_components/Lightbox";
import { useLightbox } from "./_components/useLightbox";
import { TelegramChat } from "./_components/TelegramChat";
import { CategoryIndex } from "./_components/CategoryIndex";
import { FilmRail } from "./_components/FilmRail";
import { TestimonialCard } from "./_components/TestimonialCard";
import { photos, videos, categories } from "@/lib/media";
import { carousellTestimonials } from "@/lib/testimonials-seed";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const galleries = categories
  .map((cat) => ({ ...cat, photos: photos.filter((p) => p.category === cat.id) }))
  .filter((g) => g.photos.length > 0);
const galleryIndex = galleries.map((g) => ({ id: g.id, label: g.label, count: g.photos.length }));

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
      // Every entrance and scroll effect is motion-only; with reduced motion the
      // content simply sits in place.
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-line", {
          yPercent: 120,
          opacity: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: "power4.out",
          delay: 0.2,
        });

        // The name racks into focus as it rises, hunting a hair past sharp and
        // settling back, the way a lens finds its subject.
        gsap.set(".hero-title", { filter: "blur(14px)" });
        gsap.to(".hero-title", {
          delay: 0.3,
          keyframes: [
            { filter: "blur(0px)", duration: 1, ease: "power3.out" },
            { filter: "blur(1.5px)", duration: 0.16, ease: "sine.inOut" },
            { filter: "blur(0px)", duration: 0.3, ease: "sine.out" },
          ],
          clearProps: "filter",
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
          once: true,
          onEnter: (els) => {
            // A jump down the page (a category chip, a deep link) enters every tile it
            // skipped in one batch; only the ones on screen animate, so the stagger
            // never leaves the landing view blank while off-screen tiles take their turn.
            const onScreen = (els as HTMLElement[]).filter((el) => el.getBoundingClientRect().bottom > 0);
            if (onScreen.length === 0) return;
            gsap.from(onScreen, {
              opacity: 0,
              y: 40,
              scale: 0.96,
              duration: 0.6,
              stagger: { amount: Math.min(0.36, 0.06 * (onScreen.length - 1)) },
              ease: "power3.out",
              overwrite: true,
            });
          },
        });

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
          <h1 className="hero-title mt-4 font-serif text-[15vw] leading-[0.9] md:text-[11vw] lg:text-[9rem]">
            <span className="block overflow-hidden">
              <span className="hero-line block">Anselm</span>
            </span>
            {/* Padding gives the italic g's descender room inside the reveal mask. */}
            <span className="-mb-[0.2em] block overflow-hidden pb-[0.2em]">
              <span className="hero-line block italic">Long</span>
            </span>
          </h1>
        </div>
        {/* Scroll cue: a hairline that draws downward, like film advancing. */}
        <div aria-hidden="true" className="absolute bottom-8 left-1/2 h-12 w-px -translate-x-1/2 overflow-hidden bg-white/15">
          <span className="scroll-cue block h-full w-full bg-white/70" />
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
      <FilmRail films={restVideos} onOpen={(slug) => lb.open(videos.findIndex((v) => v.slug === slug))} />

      {/* PHOTOS — grouped by category, full uncropped frames, with a sticky index */}
      <div>
        <CategoryIndex categories={galleryIndex} />
        {galleries.map(({ photos: catPhotos, ...cat }) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-32 px-6 py-12 md:scroll-mt-36 md:px-12 md:py-16">
            <h2 className="reveal mb-8 flex items-baseline gap-3 font-serif text-3xl md:text-5xl">
              {cat.label}
              <span className="font-sans text-base tabular-nums text-foreground-muted">{catPhotos.length}</span>
            </h2>
            <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>*]:mb-3">
              {catPhotos.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => lb.open(photoIndex(p.slug))}
                  className="tile group relative block w-full break-inside-avoid overflow-hidden rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <OptimizedImage
                    photo={p}
                    className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
                  <span className="pointer-events-none absolute bottom-3 left-3 flex translate-y-1 items-center gap-1.5 text-[11px] uppercase tracking-widest text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25h-4.5m4.5 0v4.5m0-4.5L15 9m-6 6l-5.25 5.25m0 0v-4.5m0 4.5h4.5M15 15l5.25 5.25m0 0v-4.5m0 4.5h-4.5" />
                    </svg>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <KindWords />
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

function KindWords() {
  const picks = [...carousellTestimonials]
    .filter((t) => t.rating === 5)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <section className="reveal border-t border-border px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.4em] text-foreground-muted">Kind words</p>
            <h2 className="font-serif text-3xl md:text-4xl">From people I&apos;ve shot for.</h2>
          </div>
          <div className="flex gap-5 text-sm">
            <Link href="/feedback" className="border-b border-foreground/40 pb-0.5 transition-opacity hover:opacity-70">
              Read all
            </Link>
            <Link href="/feedback/new" className="border-b border-foreground/40 pb-0.5 transition-opacity hover:opacity-70">
              Leave a note
            </Link>
          </div>
        </div>
        {picks.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {picks.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">
            Worked with me? <Link href="/feedback/new" className="underline underline-offset-2">I&apos;d love to hear how it went.</Link>
          </p>
        )}
      </div>
    </section>
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
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 text-sm text-foreground-muted [&>a]:py-2">
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
