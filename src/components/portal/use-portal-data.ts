"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PortalDashboard } from "@/lib/portal/dashboard";
import { friendlyNetworkError, isOffline, statusToFriendlyMessage } from "@/lib/network/errors";

export function usePortalData() {
  const router = useRouter();
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
      setError("");
    }
    try {
      if (isOffline()) {
        if (!opts?.silent) {
          setError("You appear to be offline. Check your connection and try again.");
          setData(null);
        }
        return;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15_000);
      let res: Response;
      try {
        res = await fetch("/api/portal/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }

      let json: { success?: boolean; message?: string; data?: PortalDashboard } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        if (!opts?.silent) {
          setError(statusToFriendlyMessage(res.status || 502));
          setData(null);
        }
        return;
      }

      if (res.status === 401) {
        setError(statusToFriendlyMessage(401, json.message));
        setData(null);
        router.replace("/login?next=/portal");
        return;
      }

      if (res.status === 403) {
        const reason = String(
          (json as { reason?: string }).reason ||
            (json as { data?: { reason?: string } }).data?.reason ||
            ""
        );
        const msg = String(json.message || "");
        const deleted =
          reason === "ACCOUNT_DELETED" ||
          reason === "ACCOUNT_DISABLED" ||
          /deleted|disabled|no longer available|cannot be used/i.test(msg);
        setError(statusToFriendlyMessage(403, json.message));
        setData(null);
        router.replace(deleted ? "/account-unavailable" : "/forbidden");
        return;
      }

      if (!json.success) {
        if (!opts?.silent) {
          setError(statusToFriendlyMessage(res.status, json.message || "Unable to load portal data."));
          setData(null);
        }
        return;
      }
      setData(json.data as PortalDashboard);
      if (!opts?.silent) setError("");
    } catch (err) {
      if (!opts?.silent) {
        setError(friendlyNetworkError(err, "Unable to load portal data."));
        setData(null);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [router]);

  const reloadPublic = useCallback(() => reload(), [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onOnline = () => {
      void reload();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [reload]);

  // Soft real-time: refresh portal payload so notifications/tickets stay in sync.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void reload({ silent: true });
    }, 45_000);
    return () => window.clearInterval(id);
  }, [reload]);

  return { data, loading, error, reload: reloadPublic };
}

export function formatPortalDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPortalDateTime(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
