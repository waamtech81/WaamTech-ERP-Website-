import { withApiHandler } from "@/lib/api/handler";
import { GET_builderRecommendations } from "../_handlers";

export const GET = withApiHandler(GET_builderRecommendations, {
  endpoint: "/api/commercial/builder-recommendations",
});
