import { withApiHandler } from "@/lib/api/handler";
import { GET_catalog } from "../_handlers";

export const GET = withApiHandler(async (req) => GET_catalog(req), {
  endpoint: "/api/commercial/catalog",
});
