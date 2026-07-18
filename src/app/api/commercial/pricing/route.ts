import { withApiHandler } from "@/lib/api/handler";
import { GET_pricing } from "../_handlers";

export const GET = withApiHandler(async (req) => GET_pricing(req), {
  endpoint: "/api/commercial/pricing",
});
