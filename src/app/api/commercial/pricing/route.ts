import { GET_pricing } from "../_handlers";

export async function GET(req: Request) {
  return GET_pricing(req);
}
