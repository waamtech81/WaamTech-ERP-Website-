import { GET_plans } from "../_handlers";

export async function GET(req: Request) {
  return GET_plans(req);
}
