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

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isOffline()) {
        setError("You appear to be offline. Check your connection and try again.");
        setData(null);
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
        setError(statusToFriendlyMessage(res.status || 502));
        setData(null);
        return;
      }

      if (res.status === 401) {
        setError(statusToFriendlyMessage(401, json.message));
        setData(null);
        router.replace("/unauthorized");
        return;
      }

      if (res.status === 403) {
        setError(statusToFriendlyMessage(403, json.message));
        setData(null);
        router.replace("/forbidden");
        return;
      }

      if (!json.success) {
        setError(statusToFriendlyMessage(res.status, json.message || "Unable to load portal data."));
        setData(null);
        return;
      }
      setData(json.data as PortalDashboard);
    } catch (err) {
      setError(friendlyNetworkError(err, "Unable to load portal data."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  return { data, loading, error, reload };
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
