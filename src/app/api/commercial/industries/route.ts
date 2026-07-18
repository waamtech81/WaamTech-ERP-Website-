import { withApiHandler } from "@/lib/api/handler";
import { GET_industries } from "../_handlers";

export const GET = withApiHandler(async () => GET_industries(), {
  endpoint: "/api/commercial/industries",
});
