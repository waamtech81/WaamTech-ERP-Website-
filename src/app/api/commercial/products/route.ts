import { withApiHandler } from "@/lib/api/handler";
import { GET_products } from "../_handlers";

export const GET = withApiHandler(async () => GET_products(), {
  endpoint: "/api/commercial/products",
});
