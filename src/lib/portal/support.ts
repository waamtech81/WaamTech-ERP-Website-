/**
 * Customer portal support + notifications — License Engine identity JWT APIs.
 */

import { toPublicError } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logger";
import {
  fetchCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from "@/lib/commercial/client";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";
import { friendlyNetworkError } from "@/lib/network/errors";

export type PortalTicketStatus =
  | "open"
  | "pending"
  | "waiting_customer"
  | "waiting_support"
  | "resolved"
  | "closed"
  | string;

export type PortalSupportTicket = {
  id: string;
  title: string;
  message?: string;
  status: PortalTicketStatus;
  priority?: string | null;
  department?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  product_name?: string | null;
  reply_count?: number;
  latest_reply?: string | null;
};

export type PortalTicketReply = {
  id: string;
  message: string;
  is_admin_reply?: boolean;
  is_staff?: boolean;
  author_name?: string | null;
  created_at?: string | null;
};

export type PortalTicketDetail = {
  ticket: PortalSupportTicket;
  replies: PortalTicketReply[];
  attachments: Array<{
    id: string;
    file_name: string;
    content_type?: string;
    file_size?: number;
    created_at?: string;
  }>;
  timeline: Array<{
    at: string;
    type: string;
    label: string;
    status?: string | null;
  }>;
};

export type PortalCustomerNotification = {
  id: string;
  category: string;
  title: string;
  body?: string | null;
  link?: string | null;
  is_read?: boolean | number;
  created_at?: string;
  entity_type?: string | null;
  entity_id?: string | null;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  unread_count?: number;
  counts?: Record<string, number>;
  error?: { message?: string; code?: string };
};

async function requestPortal<T>(
  method: "GET" | "POST" | "PATCH",
  paths: string[],
  accessToken: string,
  body?: Record<string, unknown>
): Promise<{
  ok: boolean;
  status: number;
  message: string;
  data?: T;
  total?: number;
  unread_count?: number;
  counts?: Record<string, number>;
  page?: number;
  limit?: number;
  totalPages?: number;
}> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  let lastStatus = 502;
  let lastMessage = "License service unavailable.";

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
      lastStatus = res.status;
      let json: Envelope<T> = {};
      try {
        json = (await res.json()) as Envelope<T>;
      } catch {
        json = { success: false, message: "Invalid response from License Engine." };
      }

      if (res.ok && json.success !== false) {
        return {
          ok: true,
          status: res.status,
          message: json.message || "OK",
          data: json.data as T,
          total: json.total,
          unread_count: json.unread_count,
          counts: json.counts,
          page: json.page,
          limit: json.limit,
          totalPages: json.totalPages,
        };
      }

      const technical = json.message || json.error?.message || `Request failed (${res.status}).`;
      logApiError(new Error(technical), {
        endpoint: path,
        httpStatus: res.status,
        technicalMessage: technical,
      });
      lastMessage = toPublicError(technical, res.status, {
        code: json.code || json.error?.code,
      }).message;
      if (res.status !== 404) {
        return { ok: false, status: res.status, message: lastMessage, data: json.data as T };
      }
    } catch (error) {
      const technical =
        error instanceof Error ? error.message : "Could not reach license server.";
      logApiError(error, { endpoint: path, httpStatus: 502, technicalMessage: technical });
      lastMessage = toPublicError(friendlyNetworkError(error, technical), 502).message;
    }
  }

  return { ok: false, status: lastStatus, message: lastMessage };
}

export async function fetchMySupportTickets(
  accessToken: string,
  query?: { status?: string; page?: number; limit?: number }
) {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.page != null) params.set("page", String(query.page));
  if (query?.limit != null) params.set("limit", String(query.limit));
  const qs = params.toString();
  return requestPortal<PortalSupportTicket[]>(
    "GET",
    [
      `/v1/identity/support/tickets${qs ? `?${qs}` : ""}`,
      `/identity/support/tickets${qs ? `?${qs}` : ""}`,
    ],
    accessToken
  );
}

export async function fetchMySupportTicket(accessToken: string, ticketId: string) {
  const id = encodeURIComponent(ticketId);
  return requestPortal<PortalTicketDetail>(
    "GET",
    [`/v1/identity/support/tickets/${id}`, `/identity/support/tickets/${id}`],
    accessToken
  );
}

export async function createMySupportTicket(
  accessToken: string,
  body: {
    title: string;
    message: string;
    license_id?: string;
    priority?: string;
    department?: string;
  }
) {
  return requestPortal<{ id: string; status: string }>(
    "POST",
    ["/v1/identity/support/tickets", "/identity/support/tickets"],
    accessToken,
    body
  );
}

export async function replyMySupportTicket(
  accessToken: string,
  ticketId: string,
  message: string
) {
  const id = encodeURIComponent(ticketId);
  return requestPortal<{ id: string }>(
    "POST",
    [
      `/v1/identity/support/tickets/${id}/replies`,
      `/identity/support/tickets/${id}/replies`,
    ],
    accessToken,
    { message }
  );
}

export async function updateMySupportTicketStatus(
  accessToken: string,
  ticketId: string,
  status: string
) {
  const id = encodeURIComponent(ticketId);
  return requestPortal<{ id: string; status: string }>(
    "PATCH",
    [
      `/v1/identity/support/tickets/${id}/status`,
      `/identity/support/tickets/${id}/status`,
    ],
    accessToken,
    { status }
  );
}

export async function uploadMySupportAttachment(
  accessToken: string,
  ticketId: string,
  body: {
    file_base64: string;
    file_name: string;
    content_type?: string;
    reply_id?: string;
  }
) {
  const id = encodeURIComponent(ticketId);
  return requestPortal<{ id: string; file_name: string }>(
    "POST",
    [
      `/v1/identity/support/tickets/${id}/attachments`,
      `/identity/support/tickets/${id}/attachments`,
    ],
    accessToken,
    body
  );
}

function normalizeCustomerNotification(row: Record<string, unknown>): PortalCustomerNotification {
  return {
    id: String(row.id || ""),
    category: String(row.type || row.category || "system"),
    title: String(row.title || ""),
    body:
      row.message != null
        ? String(row.message)
        : row.body != null
          ? String(row.body)
          : null,
    link: row.link != null ? String(row.link) : null,
    is_read: Boolean(row.is_read ?? row.read),
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    entity_type: row.entity_type != null ? String(row.entity_type) : null,
    entity_id: row.entity_id != null ? String(row.entity_id) : null,
  };
}

export async function fetchMyNotifications(
  accessToken: string,
  query?: { category?: string; unread?: boolean; page?: number; limit?: number }
) {
  // Prefer billing customer_notifications (payments, licenses, renewals).
  const billing = await fetchCustomerNotifications(accessToken, {
    filter: query?.unread ? "unread" : "all",
    type: query?.category,
    page: query?.page,
    limit: query?.limit ?? 100,
  });

  if (billing.ok) {
    const rows = Array.isArray(billing.data?.data) ? billing.data.data : [];
    const mapped = rows.map((row) =>
      normalizeCustomerNotification(row as unknown as Record<string, unknown>)
    );
    const unread_count = mapped.filter((n) => !n.is_read).length;
    return {
      ok: true as const,
      status: billing.status || 200,
      message: billing.message || "OK",
      data: mapped,
      total: billing.data?.total ?? mapped.length,
      unread_count,
    };
  }

  // Legacy identity/support path (older Engine builds).
  const params = new URLSearchParams();
  if (query?.category) params.set("category", query.category);
  if (query?.unread) params.set("unread", "1");
  if (query?.page != null) params.set("page", String(query.page));
  if (query?.limit != null) params.set("limit", String(query.limit));
  const qs = params.toString();
  const legacy = await requestPortal<PortalCustomerNotification[]>(
    "GET",
    [
      `/v1/identity/support/notifications${qs ? `?${qs}` : ""}`,
      `/identity/support/notifications${qs ? `?${qs}` : ""}`,
    ],
    accessToken
  );
  if (legacy.ok && Array.isArray(legacy.data)) {
    const mapped = legacy.data.map((row) =>
      normalizeCustomerNotification(row as unknown as Record<string, unknown>)
    );
    return {
      ...legacy,
      data: mapped,
      unread_count:
        legacy.unread_count ?? mapped.filter((n) => !n.is_read).length,
    };
  }
  return legacy;
}

export async function markMyNotificationRead(accessToken: string, notificationId: string) {
  const billing = await markCustomerNotificationRead(accessToken, notificationId);
  if (billing.ok) {
    return {
      ok: true as const,
      status: billing.status || 200,
      message: billing.message || "OK",
      data: billing.data,
    };
  }
  const id = encodeURIComponent(notificationId);
  return requestPortal(
    "PATCH",
    [
      `/v1/identity/support/notifications/${id}/read`,
      `/identity/support/notifications/${id}/read`,
    ],
    accessToken
  );
}

export async function markAllMyNotificationsRead(accessToken: string) {
  const billing = await markAllCustomerNotificationsRead(accessToken);
  if (billing.ok) {
    return {
      ok: true as const,
      status: billing.status || 200,
      message: billing.message || "OK",
      data: billing.data,
    };
  }
  return requestPortal(
    "PATCH",
    [
      "/v1/identity/support/notifications/read-all",
      "/identity/support/notifications/read-all",
    ],
    accessToken
  );
}
