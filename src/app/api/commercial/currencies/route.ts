import { withApiHandler } from "@/lib/api/handler";
import { GET_currencies } from "../_handlers";

export const GET = withApiHandler(async () => GET_currencies(), {
  endpoint: "/api/commercial/currencies",
});
