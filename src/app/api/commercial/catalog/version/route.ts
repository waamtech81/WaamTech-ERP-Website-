import { withApiHandler } from "@/lib/api/handler";
import { GET_catalogVersion } from "../../_handlers";

export const GET = withApiHandler(async (req) => GET_catalogVersion(req), {
  endpoint: "/api/commercial/catalog/version",
});
