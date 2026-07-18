import { withApiHandler } from "@/lib/api/handler";
import { GET_comparison } from "../_handlers";

export const GET = withApiHandler(async (req) => GET_comparison(req), {
  endpoint: "/api/commercial/comparison",
});
