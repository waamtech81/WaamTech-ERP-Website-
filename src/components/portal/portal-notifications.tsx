"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { formatPortalDateTime } from "@/components/portal/use-portal-data";
import {
  PortalEmptyState,
  PortalFlash,
  PortalStatusBadge,
} from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import type { PortalNotification } from "@/lib/portal/dashboard";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  license: "License",
  payment: "Payment",
  billing: "Payment",
  invoice: "Invoice",
  subscription: "Subscription",
  support: "Support",
  system: "System",
  announcement: "Announcement",
  announcements: "Announcement",
};

function categoryTone(category: string) {
  const c = category.toLowerCase();
  if (c === "payment" || c === "invoice") return "text-amber-700 bg-amber-500/10 border-amber-500/20";
  if (c === "license" || c === "subscription") return "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";
  if (c === "support") return "text-sky-700 bg-sky-500/10 border-sky-500/20";
  if (c === "announcement") return "text-violet-700 bg-violet-500/10 border-violet-500/20";
  return "text-[var(--portal-muted)] bg-[var(--portal-muted-soft)] border-[var(--portal-border)]";
}

export function PortalNotificationsView() {
  const { data } = usePortalContext();
  const [items, setItems] = useState<PortalNotification[]>(data?.notifications ?? []);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(data?.notifications ?? []);
  }, [data?.notifications]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/notifications", {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) return;
      const rows = Array.isArray(json.data) ? json.data : [];
      setItems(
        rows.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          title: String(row.title || ""),
          body:
            row.message != null
              ? String(row.message)
              : row.body != null
                ? String(row.body)
                : null,
          category: String(row.type || row.category || "system"),
          read: Boolean(row.is_read ?? row.read),
          created_at: row.created_at != null ? String(row.created_at) : undefined,
        }))
      );
    } catch {
      /* polling failures are silent */
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const timer = window.setInterval(() => {
      void fetchNotifications();
    }, 90_000);
    return () => window.clearInterval(timer);
  }, [fetchNotifications]);

  const postAction = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/portal/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(apiMessageFromJson(json, "Unable to update notification."));
    }
  };

  const markRead = (id: string) => {
    setError("");
    startTransition(async () => {
      try {
        await postAction({ action: "read", id });
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        // Avoid full dashboard reload (fans out many Engine calls → rate limits).
      } catch (err) {
        setError(friendlyNetworkError(err, "Unable to mark notification as read."));
      }
    });
  };

  const markAllRead = () => {
    setError("");
    startTransition(async () => {
      try {
        await postAction({ action: "read-all" });
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        setError(friendlyNetworkError(err, "Unable to mark all notifications as read."));
      }
    });
  };

  const unreadCount = items.filter((n) => !n.read).length;

  if (!items.length) {
    return (
      <PortalEmptyState
        title="You're all caught up"
        description="Notifications from License Engine will appear in this center."
        icon={Bell}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--portal-muted)]">
          {unreadCount ? `${unreadCount} unread` : "All notifications read"}
        </p>
        {unreadCount ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={pending}
            onClick={markAllRead}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all read
          </Button>
        ) : null}
      </div>

      {error ? <PortalFlash tone="error">{error}</PortalFlash> : null}

      <ul className="space-y-2" aria-label="Notifications">
        {items.map((n) => {
          const category = (n.category || "system").toLowerCase();
          const label = CATEGORY_LABELS[category] || category;
          return (
            <li key={n.id}>
              <article
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl border px-4 py-3.5 transition",
                  n.read
                    ? "border-[var(--portal-border)] bg-[var(--portal-soft)] opacity-80"
                    : "border-[var(--portal-primary)]/25 bg-[var(--portal-primary-soft)]/30"
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      n.read
                        ? "bg-[var(--portal-muted-soft)] text-[var(--portal-muted)]"
                        : "bg-[var(--portal-primary-soft)] text-[var(--portal-primary)]"
                    )}
                  >
                    <Bell className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm",
                        n.read
                          ? "font-medium text-[var(--portal-fg)]"
                          : "font-semibold text-[var(--portal-fg)]"
                      )}
                    >
                      {n.title}
                    </p>
                    {n.body ? (
                      <p className="mt-1 text-sm text-[var(--portal-muted)]">{n.body}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          categoryTone(category)
                        )}
                      >
                        {label}
                      </span>
                      {n.created_at ? (
                        <time
                          className="text-xs text-[var(--portal-muted)]"
                          dateTime={n.created_at}
                        >
                          {formatPortalDateTime(n.created_at)}
                        </time>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {!n.read ? (
                    <>
                      <PortalStatusBadge status="Unread" />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg px-2 text-xs"
                        disabled={pending}
                        onClick={() => markRead(n.id)}
                      >
                        Mark read
                      </Button>
                    </>
                  ) : (
                    <PortalStatusBadge status="Read" />
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
