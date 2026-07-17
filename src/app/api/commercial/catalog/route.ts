import { GET_catalog } from "../_handlers";

export async function GET(req: Request) {
  return GET_catalog(req);
}
