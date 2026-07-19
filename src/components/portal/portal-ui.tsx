"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Inbox,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PortalPageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--portal-fg)] sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--portal-muted)] sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PortalStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string | null;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  href?: string;
}) {
  const tones = {
    default: "text-[var(--portal-primary)] bg-[var(--portal-primary-soft)]",
    success: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
    warning: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
    danger: "text-rose-600 bg-rose-500/10 dark:text-rose-400",
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--portal-muted)]">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              tones[tone]
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--portal-fg)]">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-[var(--portal-muted)]">{hint}</p> : null}
    </>
  );

  const className = cn(
    "portal-card portal-card-hover block rounded-2xl p-5",
    href && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portal-primary)]"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {href ? (
        <Link href={href} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </motion.div>
  );
}

export function PortalStatusBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  if (!status) return null;
  const s = status.toLowerCase();
  const tone =
    s.includes("active") ||
    s.includes("paid") ||
    s.includes("ok") ||
    s.includes("enabled") ||
    s.includes("read") ||
    s.includes("completed") ||
    s.includes("success")
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400"
      : s.includes("trial") ||
          s.includes("pending") ||
          s.includes("grace") ||
          s.includes("unread") ||
          s.includes("suspend")
        ? "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400"
        : s.includes("expir") ||
            s.includes("lock") ||
            s.includes("fail") ||
            s.includes("cancel") ||
            s.includes("overdue") ||
            s.includes("delet") ||
            s.includes("disabled") ||
            s.includes("terminat")
          ? "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400"
          : "bg-[var(--portal-muted-soft)] text-[var(--portal-muted)] border-[var(--portal-border)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tone,
        className
      )}
    >
      {status}
    </span>
  );
}

export function PortalEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <div className="relative mb-5">
        <div
          className="absolute inset-0 rounded-3xl bg-[var(--portal-primary-soft)] blur-xl"
          aria-hidden
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] text-[var(--portal-primary)] shadow-[var(--portal-shadow)]">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
      </div>
      <h3 className="text-base font-semibold text-[var(--portal-fg)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--portal-muted)]">
        {description}
      </p>
      {action ? (
        <div className="mt-6">{action}</div>
      ) : actionLabel && actionHref ? (
        <Button asChild className="mt-6 rounded-xl" size="sm">
          {actionHref.startsWith("mailto:") || actionHref.startsWith("http") ? (
            <a href={actionHref}>{actionLabel}</a>
          ) : (
            <Link href={actionHref}>{actionLabel}</Link>
          )}
        </Button>
      ) : null}
    </div>
  );
}

export function PortalErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="portal-card flex flex-col items-start gap-4 rounded-2xl p-8"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-[var(--portal-fg)]">Unable to load this view</p>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <Button type="button" onClick={onRetry} className="rounded-xl" variant="outline">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function PortalSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading portal content">
      <div className="space-y-3">
        <div className="portal-skeleton-block h-3 w-24 rounded-lg" />
        <div className="portal-skeleton-block h-9 w-72 max-w-full rounded-xl" />
        <div className="portal-skeleton-block h-4 w-96 max-w-full rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="portal-skeleton-block h-32 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`r-${i}`} className="portal-skeleton-block h-44 rounded-2xl" />
      ))}
    </div>
  );
}

export function PortalPanel({
  title,
  description,
  action,
  children,
  className,
  flush,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("portal-card overflow-hidden rounded-2xl", className)}>
      <div className="flex flex-col gap-3 border-b border-[var(--portal-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--portal-fg)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--portal-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className={cn(flush ? "" : "p-5 sm:p-6")}>{children}</div>
    </section>
  );
}

export function PortalDataRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3.5 transition hover:border-[var(--portal-primary)]/20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--portal-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium break-all text-[var(--portal-fg)]">{value}</p>
    </div>
  );
}

export function PortalUsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone =
    pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-[var(--portal-primary)]";

  return (
    <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--portal-fg)]">{label}</span>
        <span className="tabular-nums text-[var(--portal-muted)]">
          {used} / {limit}
        </span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--portal-muted-soft)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} usage`}
      >
        <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-[var(--portal-muted)]">{pct}% of plan capacity</p>
    </div>
  );
}

export function PortalFadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
