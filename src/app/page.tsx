"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PhotoGallery } from "./_components/PhotoGallery";
import { photos, categories } from "@/lib/photos";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLElement>(null);

  // Hero animations
  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".hero-text",
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out",
          }
        );
      }, heroRef);

      return () => ctx.revert();
    },
    { scope: heroRef }
  );

  // Scroll to gallery
  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-20"
      >
        {/* Background subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <p className="hero-text text-sm uppercase tracking-[0.3em] text-foreground-muted mb-8">
            Photography by Anselm Long
          </p>

          {/* Main Title */}
          <h1 className="hero-text font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.1] mb-8">
            Capturing<br />
            <span className="italic">Authentic</span><br />
            Moments
          </h1>

          {/* Description */}
          <p className="hero-text text-lg md:text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed mb-12">
            I believe in photography that feels natural, warm, and genuine. 
            Whether it&apos;s a family portrait, a special event, or candid moments 
            with kids—I&apos;m here to tell your story.
          </p>

          {/* Stats */}
          <div className="hero-text flex items-center justify-center gap-8 md:gap-12 text-foreground-muted mb-16">
            <div className="text-center">
              <span className="block font-serif text-3xl text-foreground">{photos.length}</span>
              <span className="text-xs uppercase tracking-widest">Photos</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <span className="block font-serif text-3xl text-foreground">{categories.length}</span>
              <span className="text-xs uppercase tracking-widest">Categories</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={scrollToGallery}
            className="hero-text group flex flex-col items-center gap-3 text-foreground-muted hover:text-foreground transition-colors"
          >
            <span className="text-xs uppercase tracking-[0.2em]">View Gallery</span>
            <svg
              className="w-5 h-5 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-border" />
      </section>

      {/* Gallery Section */}
      <section
        ref={galleryRef}
        id="gallery"
        className="relative py-24 md:py-32 px-6 md:px-12 lg:px-16"
      >
        <div className="max-w-[1800px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">The Work</h2>
            <p className="text-foreground-muted max-w-lg mx-auto">
              A selection of portraits, family sessions, events, and candid moments
            </p>
          </div>

          {/* Gallery */}
          <PhotoGallery photos={photos} />
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 md:py-32 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-6">
            Let&apos;s Work Together
          </h2>
          <p className="text-foreground-muted mb-10 leading-relaxed">
            I&apos;d love to hear about your project. Whether you&apos;re planning 
            a family session, need event coverage, or want to create something 
            special—reach out and let&apos;s make it happen.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@anselmlong.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background font-medium tracking-wide hover:opacity-90 transition-opacity"
            >
              Get in Touch
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            
            <a
              href="https://anselmlong.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border text-foreground hover:bg-muted transition-colors"
            >
              View Portfolio
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-serif text-lg">Anselm Long</p>
          
          <div className="flex items-center gap-6 text-sm text-foreground-muted">
            <a href="https://anselmlong.com" className="hover:text-foreground transition-colors">
              Portfolio
            </a>
            <a href="https://instagram.com" className="hover:text-foreground transition-colors">
              Instagram
            </a>
            <a href="mailto:hello@anselmlong.com" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
          
          <p className="text-sm text-foreground-muted">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </footer>
    </main>
  );
}
