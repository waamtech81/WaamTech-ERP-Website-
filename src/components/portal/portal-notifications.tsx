"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
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

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "license", label: "License" },
  { id: "subscription", label: "Subscription" },
  { id: "payment", label: "Payment" },
  { id: "invoice", label: "Invoice" },
  { id: "system", label: "System" },
] as const;

type FilterId = (typeof FILTER_OPTIONS)[number]["id"];

function categoryTone(category: string) {
  const c = category.toLowerCase();
  if (c === "payment" || c === "invoice" || c === "billing") {
    return "text-amber-700 bg-amber-500/10 border-amber-500/20";
  }
  if (c === "license" || c === "subscription") {
    return "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";
  }
  if (c === "support") return "text-sky-700 bg-sky-500/10 border-sky-500/20";
  if (c === "announcement" || c === "announcements") {
    return "text-violet-700 bg-violet-500/10 border-violet-500/20";
  }
  return "text-[var(--portal-muted)] bg-[var(--portal-muted-soft)] border-[var(--portal-border)]";
}

function mapNotificationRows(rows: Record<string, unknown>[]): PortalNotification[] {
  return rows.map((row) => ({
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
  }));
}

function buildFilterParams(filter: FilterId): URLSearchParams {
  const params = new URLSearchParams({ limit: "100" });
  if (filter === "unread") {
    params.set("filter", "unread");
  } else if (filter === "all") {
    params.set("filter", "all");
  } else if (filter === "payment") {
    params.set("type", "payment");
  } else {
    params.set("type", filter);
  }
  return params;
}

export function PortalNotificationsView() {
  const { data } = usePortalContext();
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [filter, setFilter] = useState<FilterId>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = buildFilterParams(filter);
      const res = await fetch(`/api/portal/notifications?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json();
      if (!json.success) {
        setError(apiMessageFromJson(json, "Unable to load notifications."));
        setItems([]);
        return;
      }
      const rows = Array.isArray(json.data) ? json.data : [];
      setItems(mapNotificationRows(rows as Record<string, unknown>[]));
    } catch (err) {
      setError(friendlyNetworkError(err, "Unable to load notifications."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Instant first paint from dashboard aggregate (all filter only); API remains SSOT.
  useEffect(() => {
    if (filter !== "all" || !data?.notifications?.length) return;
    setItems((prev) => (prev.length === 0 ? data.notifications! : prev));
  }, [data?.notifications, filter]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void fetchNotifications();
    };
    window.addEventListener("portal-notifications-refresh", refresh);
    // Align with portal dashboard soft-refresh cadence to avoid dual Engine pressure.
    const timer = window.setInterval(refresh, 300_000);
    let lastVisibilityFetch = 0;
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastVisibilityFetch < 5_000) return;
      lastVisibilityFetch = now;
      void fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("portal-notifications-refresh", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
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

  const displayItems = useMemo(() => items, [items]);
  const unreadCount = items.filter((n) => !n.read).length;

  if (loading && !items.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--portal-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading notifications…
      </div>
    );
  }

  if (!loading && !displayItems.length) {
    return (
      <div className="space-y-4">
        <FilterBar filter={filter} onFilter={setFilter} unreadCount={unreadCount} />
        {error ? <PortalFlash tone="error">{error}</PortalFlash> : null}
        <PortalEmptyState
          icon={Bell}
          title={filter === "all" ? "You're all caught up" : "No matching notifications"}
          description={
            filter === "all"
              ? "New billing, license, and system alerts will appear here."
              : "Try another filter to see more notifications."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        filter={filter}
        onFilter={setFilter}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        pending={pending}
      />
      {error ? <PortalFlash tone="error">{error}</PortalFlash> : null}
      <ul className="divide-y divide-[var(--portal-border)] rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)]">
        {displayItems.map((n) => (
          <li
            key={n.id}
            className={cn(
              "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between",
              !n.read && "bg-[var(--portal-muted-soft)]/40"
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-[var(--portal-fg)]">{n.title}</span>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    categoryTone(String(n.category || "system"))
                  )}
                >
                  {CATEGORY_LABELS[String(n.category || "system").toLowerCase()] ||
                    n.category ||
                    "System"}
                </span>
                {!n.read ? (
                  <PortalStatusBadge status="Unread" />
                ) : null}
              </div>
              {n.body ? (
                <p className="text-sm text-[var(--portal-muted-strong)]">{n.body}</p>
              ) : null}
              {n.created_at ? (
                <p className="text-xs text-[var(--portal-muted)]">
                  {formatPortalDateTime(n.created_at)}
                </p>
              ) : null}
            </div>
            {!n.read ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
                disabled={pending}
                onClick={() => markRead(n.id)}
              >
                Mark read
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterBar({
  filter,
  onFilter,
  unreadCount,
  onMarkAllRead,
  pending,
}: {
  filter: FilterId;
  onFilter: (id: FilterId) => void;
  unreadCount: number;
  onMarkAllRead?: () => void;
  pending?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onFilter(opt.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === opt.id
                ? "border-[var(--portal-accent)] bg-[var(--portal-accent-soft)] text-[var(--portal-accent-fg)]"
                : "border-[var(--portal-border)] text-[var(--portal-muted-strong)] hover:bg-[var(--portal-muted-soft)]"
            )}
          >
            {opt.label}
            {opt.id === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>
      {onMarkAllRead && unreadCount > 0 ? (
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={onMarkAllRead}>
          <CheckCheck className="mr-1 h-4 w-4" />
          Mark all read
        </Button>
      ) : null}
    </div>
  );
}
