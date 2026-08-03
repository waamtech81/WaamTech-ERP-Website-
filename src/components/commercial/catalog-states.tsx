"use client";

import type { ReactNode } from "react";
import { Loader2, RefreshCw, AlertTriangle, Inbox, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CatalogSkeleton({
  rows = 3,
  className,
  label = "Loading catalog",
}: {
  rows?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-border bg-gradient-to-b from-slate-100/90 to-slate-50/80"
        />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function CatalogErrorState({
  message,
  onRetry,
  className,
  offline,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
  offline?: boolean;
}) {
  const Icon = offline ? WifiOff : AlertTriangle;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 px-6 py-12 text-center",
        offline && "border-amber-100 bg-amber-50/70",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={cn("h-8 w-8", offline ? "text-amber-600" : "text-rose-500")} aria-hidden />
      <p className={cn("max-w-md text-sm leading-relaxed", offline ? "text-amber-950" : "text-rose-900")}>
        {message ||
          (offline
            ? "You appear to be offline. Check your connection and try again."
            : "Catalog is temporarily unavailable. Please try again in a moment.")}
      </p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

/** Compact error + retry for signup dropdown lists */
export function CatalogSelectError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <li className="space-y-2 px-3 py-4 text-center" role="alert">
      <p className="text-sm text-rose-600">{message || "Unable to load options."}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onRetry();
          }}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      ) : null}
    </li>
  );
}

export function CatalogEmptyState({
  message,
  className,
  action,
}: {
  message?: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center",
        className
      )}
      role="status"
    >
      <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {message || "Nothing to show here yet."}
      </p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Compare Plans section when License Engine comparison API is down (plans may still work). */
export function CatalogComparisonUnavailable({
  message =
    "Plan comparison is temporarily unavailable. Please refresh or try again shortly.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-6 py-10 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <AlertTriangle className="h-7 w-7 text-amber-600" aria-hidden />
      <p className="max-w-lg text-sm leading-relaxed text-amber-950">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      ) : null}
    </div>
  );
}

export function CatalogLoadingInline({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
