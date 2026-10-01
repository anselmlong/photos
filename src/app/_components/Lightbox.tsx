"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AutoVideo } from "./AutoVideo";
import type { Photo, VideoClip } from "@/lib/media";
import { describePhoto } from "@/lib/photo-label";

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

type Direction = "prev" | "next";

// Swipe tuning (px, px/ms). A short flick or a long drag both count.
const AXIS_LOCK = 10;
const SWIPE_DISTANCE = 60;
const DISMISS_DISTANCE = 110;
const FLICK_VELOCITY = 0.45;

const FOCUSABLE = 'button, [href], video[controls], [tabindex]:not([tabindex="-1"])';

/** Matches the tile that opens an item, so closing can land on the frame last seen. */
export const lightboxKey = (item: LightboxItem) =>
  item.kind === "photo" ? item.slug : `video-${item.slug}`;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll a tile into view with its scroll margins, clear of the sticky nav.
 * Done by hand because scrollIntoView drops the margin for a tile inside the
 * film rail, leaving it under the nav.
 */
function bringIntoView(tile: HTMLElement) {
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  const r = tile.getBoundingClientRect();
  const style = getComputedStyle(tile);
  const top = r.top - (parseFloat(style.scrollMarginTop) || 0);
  const bottom = r.bottom + (parseFloat(style.scrollMarginBottom) || 0);
  // Smallest move that shows it; a portrait taller than the screen keeps its top.
  const dy = top < 0 ? top : bottom > window.innerHeight ? Math.min(bottom - window.innerHeight, top) : 0;
  if (dy !== 0) window.scrollBy({ top: dy, behavior });

  const rail = tile.parentElement;
  if (rail && rail.scrollWidth > rail.clientWidth) {
    const box = rail.getBoundingClientRect();
    rail.scrollBy({ left: r.left + r.width / 2 - (box.left + box.width / 2), behavior });
  }
}

export function Lightbox({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: LightboxProps) {
  const current = items[currentIndex];
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Which side the next item slides in from; null = just opened.
  const [enter, setEnter] = useState<Direction | null>(null);

  const go = useCallback(
    (direction: Direction) => {
      if (items.length < 2) return;
      setEnter(direction);
      onNavigate(direction);
    },
    [items.length, onNavigate]
  );

  // Forget the slide direction so the next open scales in rather than slides.
  const close = useCallback(() => {
    setEnter(null);
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") close();
      // A focused video uses the arrows to seek, so leave them alone there.
      const onVideo = e.target instanceof HTMLVideoElement;
      if (e.key === "ArrowLeft" && !onVideo) go("prev");
      if (e.key === "ArrowRight" && !onVideo) go("next");

      // Keep Tab inside the dialog while it is open.
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        const inside = active instanceof Node && dialogRef.current.contains(active);
        if (e.shiftKey && (active === first || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, close, go]
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

  // Kept current for the close handoff below, which runs from a stale closure.
  const currentKey = useRef<string | null>(null);
  useEffect(() => {
    currentKey.current = current ? lightboxKey(current) : null;
  });

  // Move focus into the dialog on open. On close, hand it to the tile of the
  // frame last shown, so browsing ten photos in and closing leaves the visitor
  // there rather than back at the one they opened.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      const key = currentKey.current;
      const tile = key ? document.querySelector<HTMLElement>(`[data-lightbox-key="${CSS.escape(key)}"]`) : null;
      const target = tile ?? opener;
      if (!target) return;
      target.focus({ preventScroll: true });
      if (target !== opener) bringIntoView(target);
    };
  }, [isOpen]);

  // Swipes own one-finger drags, but once the visitor pinch-zooms in,
  // give panning back to the browser so they can look around the frame.
  useEffect(() => {
    const vv = window.visualViewport;
    const dialog = dialogRef.current;
    if (!isOpen || !vv || !dialog) return;
    const sync = () => {
      dialog.style.touchAction = vv.scale > 1.01 ? "auto" : "pinch-zoom";
    };
    sync();
    vv.addEventListener("resize", sync);
    return () => vv.removeEventListener("resize", sync);
  }, [isOpen]);

  // ---- touch swipe: left/right to browse, down to dismiss ----
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    t: number;
    axis: "x" | "y" | null;
    follow: boolean;
  } | null>(null);
  const dragged = useRef(false);

  const setStage = (transform: string, opacity = 1, animate = false) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.transition = animate ? "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease-out" : "none";
    stage.style.transform = transform;
    stage.style.opacity = String(opacity);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!drag.current) dragged.current = false;
    if (e.pointerType === "mouse") return;
    if (drag.current) {
      // A second finger means a pinch, not a swipe.
      drag.current = null;
      setStage("", 1, true);
      return;
    }
    if (window.visualViewport && window.visualViewport.scale > 1.01) return;
    // Native video controls keep their own drags (scrubbing, volume).
    if ((e.target as Element).closest("video")) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, axis: null, follow: !prefersReducedMotion() };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      dragged.current = true;
    }
    if (!d.follow) return;
    if (d.axis === "x") {
      // Rubber-band when there is nowhere to go.
      setStage(`translate3d(${items.length > 1 ? dx : dx * 0.25}px, 0, 0)`);
    } else if (dy > 0) {
      setStage(`translate3d(0, ${dy}px, 0) scale(${1 - Math.min(dy / 2000, 0.08)})`, 1 - Math.min(dy / 500, 0.6));
    }
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    const elapsed = Math.max(e.timeStamp - d.t, 1);
    const cancelled = e.type === "pointercancel";

    if (!cancelled && d.axis === "x" && items.length > 1 &&
        (Math.abs(dx) > SWIPE_DISTANCE || Math.abs(dx) / elapsed > FLICK_VELOCITY)) {
      setStage("");
      go(dx < 0 ? "next" : "prev");
      return;
    }
    if (!cancelled && d.axis === "y" && dy > 0 &&
        (dy > DISMISS_DISTANCE || dy / elapsed > FLICK_VELOCITY)) {
      close();
      return;
    }
    setStage("", 1, d.follow);
  };

  if (!isOpen || !current) return null;

  const neighbours = items.length > 1
    ? [items[(currentIndex + 1) % items.length], items[(currentIndex - 1 + items.length) % items.length]]
    : [];
  // Photos are named by category and place, not the file names their alts come from.
  const { label, description, position } =
    current.kind === "photo"
      ? describePhoto(current, items.filter((i): i is LightboxItem & Photo => i.kind === "photo"))
      : { label: current.title, description: current.title, position: null };
  const enterClass = enter === "next" ? "animate-slideInNext" : enter === "prev" ? "animate-slideInPrev" : "animate-scaleIn";
  const control = "rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/80";
  // On phones the arrows sit in the bottom corners, under the thumb and clear of
  // the photo; beside it they would cover its edges. Wider screens centre them.
  const arrow = "absolute bottom-4 z-20 p-3 text-white/50 hover:text-white md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:p-4";
  const arrowIcon = "h-7 w-7 md:h-10 md:w-10";

  const content = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery viewer"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn"
      style={{ touchAction: "pinch-zoom" }}
      onClickCapture={(e) => {
        // A swipe can end in a synthetic click (even on the arrows); swallow it.
        if (!dragged.current || e.detail === 0) return;
        dragged.current = false;
        e.stopPropagation();
        e.preventDefault();
      }}
      onClick={close}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <button
        ref={closeRef}
        onClick={close}
        className={`absolute top-6 right-6 z-20 p-3 text-white/60 hover:text-white ${control}`}
        aria-label="Close"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute top-6 left-6 z-20 text-sm font-light tabular-nums text-white/50" aria-hidden="true">
        {currentIndex + 1} / {items.length}
      </div>
      <p className="sr-only" aria-live="polite">
        {/* A photo's description already says where it sits. */}
        {position ? description : `${currentIndex + 1} of ${items.length}: ${description}`}
      </p>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go("prev");
            }}
            className={`${arrow} left-2 md:left-8 ${control}`}
            aria-label="Previous"
          >
            <svg className={arrowIcon} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go("next");
            }}
            className={`${arrow} right-2 md:right-8 ${control}`}
            aria-label="Next"
          >
            <svg className={arrowIcon} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      <div ref={stageRef} className="will-change-transform">
        <div
          key={lightboxKey(current)}
          className={`relative flex max-h-[85dvh] max-w-[92vw] flex-col items-center px-4 md:px-16 ${enterClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {current.kind === "photo" ? (
            <picture>
              <source srcSet={current.avif} type="image/avif" />
              <source srcSet={current.webp} type="image/webp" />
              <img
                src={current.src}
                alt={description}
                width={current.width}
                height={current.height}
                draggable={false}
                className="max-h-[70dvh] w-auto max-w-full object-contain select-none md:max-h-[78dvh]"
                style={{
                  backgroundImage: `url(${current.blurDataURL})`,
                  backgroundSize: "cover",
                }}
              />
            </picture>
          ) : (
            <div className="w-[min(92vw,1100px)] overflow-hidden rounded-sm">
              <AutoVideo video={current} controls priority />
            </div>
          )}

          <div className="mt-6 text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</span>
            {position && (
              <span className="text-xs tabular-nums tracking-[0.2em] text-white/60" aria-hidden="true">
                {" · "}
                {position.replace(" of ", " / ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Warm the cache for the frames either side so browsing feels instant. */}
      <div hidden aria-hidden="true">
        {neighbours.map((n) =>
          n.kind === "photo" ? (
            <picture key={n.slug}>
              <source srcSet={n.avif} type="image/avif" />
              <source srcSet={n.webp} type="image/webp" />
              <img src={n.src} alt="" />
            </picture>
          ) : null
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
