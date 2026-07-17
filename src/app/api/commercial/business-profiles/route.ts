import { GET_businessProfiles } from "../_handlers";

export async function GET(req: Request) {
  return GET_businessProfiles(req);
}
