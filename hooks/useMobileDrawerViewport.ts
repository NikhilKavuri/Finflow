"use client";

import { useEffect } from "react";

/** Locks body scroll and syncs visual viewport height for bottom sheets on mobile. */
export function useMobileDrawerViewport(active = true) {
  useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;

    const syncViewportHeight = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const offset = window.innerHeight - (window.visualViewport?.height ?? window.innerHeight);
      root.style.setProperty("--visual-viewport-height", `${vh}px`);
      root.style.setProperty("--keyboard-offset", `${Math.max(0, offset)}px`);
    };

    syncViewportHeight();
    document.body.style.overflow = "hidden";
    window.visualViewport?.addEventListener("resize", syncViewportHeight);
    window.visualViewport?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);

    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.removeProperty("--visual-viewport-height");
      root.style.removeProperty("--keyboard-offset");
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      window.visualViewport?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
    };
  }, [active]);
}
