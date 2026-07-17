import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimateInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
};

/**
 * Lightweight wrapper — no scroll-linked animations (those cause scroll jank).
 * delay/direction kept for API compatibility with existing call sites.
 */
export function AnimateIn({ children, className }: AnimateInProps) {
  return <div className={cn(className)}>{children}</div>;
}
