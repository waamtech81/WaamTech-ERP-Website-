import { withApiHandler } from "@/lib/api/handler";
import { GET_industryDetail } from "../../_handlers";

type Params = { params: Promise<{ industryId: string }> };

export const GET = withApiHandler(
  async (req, context) => {
    const { industryId } = await (context as Params).params;
    return GET_industryDetail(req, industryId);
  },
  { endpoint: "/api/commercial/industries/[industryId]" }
);
