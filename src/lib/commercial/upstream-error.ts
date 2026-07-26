/**
 * Preserve License Engine validation messages for commercial UI — never replace
 * with generic "Something went wrong" when the upstream body is readable.
 */
export function commercialUpstreamMessage(
  raw: string | undefined,
  status: number,
  fallback: string
): string {
  const text = String(raw || "").trim();
  if (text && text.length <= 240) return text;
  if (status === 404) return text || "Route not found on License Engine.";
  if (status === 401) return text || "License Engine authentication required.";
  if (status === 403) return text || "This commercial request is not allowed.";
  if (status === 409) return text || "This configuration conflicts with an existing record.";
  if (status === 422) return text || "License Engine could not validate this request.";
  if (status === 429) return text || "Too many requests. Please retry shortly.";
  if (status >= 500) return text || fallback;
  return text || fallback;
}
