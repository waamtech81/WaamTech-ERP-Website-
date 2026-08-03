import { withApiHandler } from "@/lib/api/handler";
import { GET_commercialRegistry } from "../_handlers";

export const GET = withApiHandler(GET_commercialRegistry, {
  endpoint: "/api/commercial/commercial-registry",
});
