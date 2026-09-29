"use client";

import { useEffect, useRef } from "react";

// Six blades; each is a slab whose inner edge sits on a hexagon around the lens.
const BLADES = [0, 60, 120, 180, 240, 300];

/** transitions-dev success check, framed as a lens: the iris snaps shut and
 * reopens once, like a shutter firing, then the check draws inside it. The
 * wrapper is mounted with data-state="in" so the sequence runs on load. Stroke
 * length is measured at runtime so the draw always covers the path exactly. */
export function SuccessCheck() {
  const pathRef = useRef<SVGPathElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = Math.ceil(path.getTotalLength());
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    void wrapRef.current?.offsetWidth; // reflow so the animation starts fresh
    wrapRef.current?.setAttribute("data-state", "in");
  }, []);

  return (
    <span
      ref={wrapRef}
      className="t-success-check mx-auto mb-6"
      data-state="out"
      aria-hidden="true"
    >
      <svg className="h-16 w-16" viewBox="0 0 48 48" fill="none">
        <defs>
          <clipPath id="success-lens">
            <circle cx="24" cy="24" r="21" />
          </clipPath>
        </defs>
        <g clipPath="url(#success-lens)" className="shutter-iris">
          {BLADES.map((angle) => (
            <g key={angle} transform={`rotate(${angle + 15} 24 24)`}>
              <rect className="shutter-blade" x="45" y="-24" width="48" height="96" fill="currentColor" />
            </g>
          ))}
        </g>
        <circle cx="24" cy="24" r="21.5" stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} />
        <path
          ref={pathRef}
          d="M16 24.5 L21.5 30 L32.5 18.5"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
