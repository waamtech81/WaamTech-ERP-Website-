import { withApiHandler } from "@/lib/api/handler";
import { GET_businessCategories } from "../_handlers";

export const GET = withApiHandler(async (req) => GET_businessCategories(req), {
  endpoint: "/api/commercial/business-categories",
});
