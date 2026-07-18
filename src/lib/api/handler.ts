import type { NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/api/response";
import { createRequestId } from "@/lib/api/logger";
import type { ErrorLogContext } from "@/lib/api/errors";

type RouteContext = { params?: Promise<Record<string, string | string[]>> };

type ApiRouteHandler = (
  req: Request | NextRequest,
  context?: RouteContext
) => Promise<Response> | Response;

/**
 * Wrap a route handler so uncaught exceptions never leak technical details.
 */
export function withApiHandler(
  handler: ApiRouteHandler,
  options?: {
    endpoint?: string;
    resolveLogContext?: (
      req: Request | NextRequest
    ) => Partial<ErrorLogContext> | Promise<Partial<ErrorLogContext>>;
  }
): ApiRouteHandler {
  return async (req, routeContext) => {
    const requestId = createRequestId();
    const endpoint =
      options?.endpoint ||
      (() => {
        try {
          return new URL(req.url).pathname;
        } catch {
          return undefined;
        }
      })();

    try {
      return await handler(req, routeContext);
    } catch (error) {
      const extra = options?.resolveLogContext
        ? await options.resolveLogContext(req)
        : {};
      return toErrorResponse(error, {
        requestId,
        endpoint,
        method: req.method,
        ...extra,
      });
    }
  };
}
