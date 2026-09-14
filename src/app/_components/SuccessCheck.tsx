"use client";

import { useEffect, useRef } from "react";

/** transitions-dev success check: fades/rotates/blurs/Y-bobs in a checkmark
 * and draws its stroke. The wrapper is mounted with data-state="in" so the
 * appear animation runs on load. Stroke length is measured at runtime so the
 * draw always covers the path exactly regardless of viewBox. */
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
      <svg
        className="h-16 w-16"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          ref={pathRef}
          d="M12 34 L22 22 L30 26 L36 12"
        />
      </svg>
    </span>
  );
}