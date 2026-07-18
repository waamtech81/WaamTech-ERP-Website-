import { withApiHandler } from "@/lib/api/handler";
import { GET_plans } from "../_handlers";

export const GET = withApiHandler(async (req) => GET_plans(req), {
  endpoint: "/api/commercial/plans",
});
