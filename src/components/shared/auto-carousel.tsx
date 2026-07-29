"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AutoCarouselProps = {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  /** Auto-advance interval in ms. Set 0 to disable. */
  intervalMs?: number;
  ariaLabel?: string;
};

/**
 * Horizontal card carousel — auto-plays, left/right controls, no visible scrollbar.
 */
export function AutoCarousel({
  children,
  className,
  trackClassName,
  intervalMs = 4500,
  ariaLabel = "Carousel",
}: AutoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateNav = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  const scrollByPage = useCallback((dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.75, 180);
    const max = el.scrollWidth - el.clientWidth;
    let next = el.scrollLeft + dir * step;
    if (dir === 1 && el.scrollLeft >= max - 8) next = 0;
    if (dir === -1 && el.scrollLeft <= 8) next = max;
    el.scrollTo({ left: next, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateNav();
    el.addEventListener("scroll", updateNav, { passive: true });
    const ro = new ResizeObserver(updateNav);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateNav);
      ro.disconnect();
    };
  }, [updateNav, children]);

  useEffect(() => {
    if (!intervalMs || paused) return;
    const id = window.setInterval(() => scrollByPage(1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, paused, scrollByPage]);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        aria-roledescription="carousel"
        className={cn(
          "flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          trackClassName
        )}
      >
        {children}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Previous"
          disabled={!canPrev && !canNext}
          onClick={() => scrollByPage(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-[#0b1f3a] shadow-sm transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next"
          disabled={!canPrev && !canNext}
          onClick={() => scrollByPage(1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-[#0b1f3a] shadow-sm transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
