import { withApiHandler } from "@/lib/api/handler";
import { POST_catalogRevalidate } from "../../_handlers";

export const POST = withApiHandler(async (req) => POST_catalogRevalidate(req), {
  endpoint: "/api/commercial/catalog/revalidate",
});
