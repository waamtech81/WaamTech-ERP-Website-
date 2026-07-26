import { withApiHandler } from "@/lib/api/handler";
import { GET_modules } from "../_handlers";

export const GET = withApiHandler(async (req) => GET_modules(req), {
  endpoint: "/api/commercial/modules",
});
