import { withApiHandler } from "@/lib/api/handler";
import { GET_businessProfiles } from "../_handlers";

export const GET = withApiHandler(async (req) => GET_businessProfiles(req), {
  endpoint: "/api/commercial/business-profiles",
});
