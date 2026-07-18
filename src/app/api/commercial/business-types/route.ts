import { withApiHandler } from "@/lib/api/handler";
import { GET_businessTypes } from "../_handlers";

export const GET = withApiHandler(async (req) => GET_businessTypes(req), {
  endpoint: "/api/commercial/business-types",
});
