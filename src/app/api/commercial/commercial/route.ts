import { withApiHandler } from "@/lib/api/handler";
import { GET_commercial } from "../_handlers";

export const GET = withApiHandler(GET_commercial, {
  endpoint: "/api/commercial/commercial",
});
