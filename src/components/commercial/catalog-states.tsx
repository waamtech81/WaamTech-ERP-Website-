"use client";

import { Loader2, RefreshCw, AlertTriangle, Inbox, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CatalogSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)} aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-border bg-slate-100/80"
        />
      ))}
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
    >
      <Icon className={cn("h-8 w-8", offline ? "text-amber-600" : "text-rose-500")} />
      <p className={cn("max-w-md text-sm", offline ? "text-amber-950" : "text-rose-900")}>
        {message ||
          (offline
            ? "You appear to be offline. Check your connection and try again."
            : "Commercial catalog is temporarily unavailable.")}
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
    <li className="space-y-2 px-3 py-4 text-center">
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
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center",
        className
      )}
    >
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="max-w-md text-sm text-muted-foreground">
        {message || "No commercial items are published yet."}
      </p>
    </div>
  );
}

export function CatalogLoadingInline({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
