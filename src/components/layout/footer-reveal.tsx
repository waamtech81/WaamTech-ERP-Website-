"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky footer reveal (Huekland-style):
 * outer spacer reserves scroll height; inner is fixed at the bottom
 * and is revealed as main content scrolls away. No clip-path.
 */
export function FooterReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const outerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      outer.style.height = "";
      outer.classList.add("wt-footer-sticky-reveal--static");
      return;
    }

    let raf = 0;
    const syncHeight = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        outer.style.height = `${inner.offsetHeight}px`;
      });
    };

    syncHeight();

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(syncHeight);
      observer.observe(inner);
    }

    window.addEventListener("resize", syncHeight, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, []);

  return (
    <footer ref={outerRef} className={cn("wt-footer wt-footer-sticky-reveal", className)}>
      <div ref={innerRef} className="wt-footer-sticky-reveal__inner">
        {children}
      </div>
    </footer>
  );
}
