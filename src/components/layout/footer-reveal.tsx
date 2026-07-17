"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Huekland / NextBricks-style sticky footer reveal:
 * outer spacer reserves scroll height; inner is fixed at the bottom
 * and is revealed as the page content scrolls away.
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

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      outer.style.height = "";
      return;
    }

    const syncHeight = () => {
      outer.style.height = `${inner.scrollHeight}px`;
    };

    syncHeight();

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(syncHeight);
      observer.observe(inner);
    }

    window.addEventListener("resize", syncHeight, { passive: true });
    return () => {
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
