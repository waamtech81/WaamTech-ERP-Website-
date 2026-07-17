import { GET_businessCategories } from "../_handlers";

export async function GET(req: Request) {
  return GET_businessCategories(req);
}
