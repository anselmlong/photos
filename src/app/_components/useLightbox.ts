"use client";

import { useCallback, useState } from "react";
import type { LightboxItem } from "./Lightbox";

/** Shared open/navigate state for the Lightbox, reused across variants. */
export function useLightbox(items: LightboxItem[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const open = useCallback((i: number) => {
    setIndex(i);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const navigate = useCallback(
    (direction: "prev" | "next") => {
      setIndex((prev) => {
        if (direction === "prev") return prev === 0 ? items.length - 1 : prev - 1;
        return prev === items.length - 1 ? 0 : prev + 1;
      });
    },
    [items.length]
  );

  return { isOpen, index, open, close, navigate, goToIndex: setIndex };
}
