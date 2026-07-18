import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { readPortalTokens } from "@/lib/auth/session";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import {
  createMySupportTicket,
  fetchMySupportTicket,
  fetchMySupportTickets,
  replyMySupportTicket,
  updateMySupportTicketStatus,
  uploadMySupportAttachment,
} from "@/lib/portal/support";
import { isSameOrigin } from "@/lib/security/guards";

export const GET = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const resolved = await resolvePortalAccess();
    if (!resolved.ok) {
      const res = apiFail(resolved.message, {
        status: resolved.status,
        code: ApiErrorCode.UNAUTHORIZED,
      });
      return clearPortalOnUnauthorized(res, resolved.status);
    }

    const url = new URL(req.url);
    const ticketId = url.searchParams.get("id");
    const status = url.searchParams.get("status") || undefined;

    const result = ticketId
      ? await fetchMySupportTicket(resolved.access.accessToken, ticketId)
      : await fetchMySupportTickets(resolved.access.accessToken, {
          status,
          limit: 50,
        });

    if (!result.ok) {
      return apiFail(result.message || "Unable to load tickets.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess("OK", {
      data: result.data,
      extra: {
        counts: result.counts || null,
        total: result.total ?? null,
      },
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/support" }
);

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const resolved = await resolvePortalAccess();
    if (!resolved.ok) {
      const res = apiFail(resolved.message, {
        status: resolved.status,
        code: ApiErrorCode.UNAUTHORIZED,
      });
      return clearPortalOnUnauthorized(res, resolved.status);
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      ticket_id?: string;
      title?: string;
      message?: string;
      license_id?: string;
      priority?: string;
      department?: string;
      status?: string;
      file_base64?: string;
      file_name?: string;
      content_type?: string;
    };

    const action = String(body.action || "create").trim();
    let result;

    if (action === "create") {
      const title = String(body.title || "").trim();
      const message = String(body.message || "").trim();
      if (!title || !message) {
        return apiFail("Title and message are required.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      result = await createMySupportTicket(resolved.access.accessToken, {
        title,
        message,
        license_id: body.license_id,
        priority: body.priority,
        department: body.department,
      });
    } else if (action === "reply") {
      const ticketId = String(body.ticket_id || "").trim();
      const message = String(body.message || "").trim();
      if (!ticketId || !message) {
        return apiFail("Ticket and message are required.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      result = await replyMySupportTicket(
        resolved.access.accessToken,
        ticketId,
        message
      );
    } else if (action === "status") {
      const ticketId = String(body.ticket_id || "").trim();
      const status = String(body.status || "").trim();
      if (!ticketId || !status) {
        return apiFail("Ticket and status are required.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      result = await updateMySupportTicketStatus(
        resolved.access.accessToken,
        ticketId,
        status
      );
    } else if (action === "attach") {
      const ticketId = String(body.ticket_id || "").trim();
      if (!ticketId || !body.file_base64 || !body.file_name) {
        return apiFail("Ticket and file are required.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      result = await uploadMySupportAttachment(resolved.access.accessToken, ticketId, {
        file_base64: body.file_base64,
        file_name: body.file_name,
        content_type: body.content_type,
      });
    } else {
      return apiFail("Unknown action.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    if (!result.ok) {
      return apiFail(result.message || "Support request failed.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess(result.message || "OK", { data: result.data });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/support" }
);
