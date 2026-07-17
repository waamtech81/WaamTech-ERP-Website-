import { GET_comparison } from "../_handlers";

export async function GET(req: Request) {
  return GET_comparison(req);
}
