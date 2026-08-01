"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { PartyPopper, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  code?: string | null;
  savingsLabel?: string | null;
  onClose: () => void;
};

const CONFETTI = [
  "#0549a4",
  "#38bdf8",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#fb7185",
];

/** Center-screen celebration when a coupon applies successfully. */
export function CouponCelebrate({ open, code, savingsLabel, onClose }: Props) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 17) % 88)}%`,
        delay: (i % 10) * 0.04,
        duration: 1.4 + (i % 5) * 0.15,
        color: CONFETTI[i % CONFETTI.length],
        rotate: (i * 37) % 360,
        size: 6 + (i % 5) * 2,
      })),
    []
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(onClose, 4200);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coupon-celebrate-title"
    >
      <motion.button
        type="button"
        aria-label="Dismiss celebration"
        className="absolute inset-0 bg-[#0b1f3a]/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {!reduce
        ? pieces.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden
              className="pointer-events-none absolute top-[18%] rounded-sm"
              style={{
                left: p.left,
                width: p.size,
                height: p.size * 0.55,
                backgroundColor: p.color,
              }}
              initial={{ opacity: 0, y: -20, rotate: 0, scale: 0.6 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [0, 40, 180, 280],
                rotate: [0, p.rotate, p.rotate + 120],
                scale: [0.6, 1, 0.9, 0.7],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeOut",
              }}
            />
          ))
        : null}

      <motion.div
        className="relative z-[1] w-full max-w-md overflow-hidden rounded-3xl border border-emerald-200/80 bg-white p-7 text-center shadow-[0_28px_80px_rgba(11,31,58,0.28)]"
        initial={reduce ? false : { opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-[#0b1f3a]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <motion.div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white shadow-lg shadow-emerald-500/30"
          animate={
            reduce
              ? undefined
              : { rotate: [0, -8, 8, -4, 0], scale: [1, 1.08, 1] }
          }
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <PartyPopper className="h-8 w-8" aria-hidden />
        </motion.div>

        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Coupon unlocked
        </p>

        <h2
          id="coupon-celebrate-title"
          className="mt-3 font-heading text-2xl font-semibold tracking-tight text-[#0b1f3a] sm:text-[1.75rem]"
        >
          Congratulations!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Your discount is live
          {code ? (
            <>
              {" "}
              for <span className="font-semibold text-[#0b1f3a]">{code}</span>
            </>
          ) : null}
          . Enjoy the savings on your custom ERP package.
        </p>
        {savingsLabel ? (
          <p className="mt-3 text-lg font-semibold text-emerald-700">{savingsLabel}</p>
        ) : null}

        <Button type="button" className="mt-6 rounded-full px-6" onClick={onClose}>
          Continue building
        </Button>
      </motion.div>
    </div>,
    document.body
  );
}
