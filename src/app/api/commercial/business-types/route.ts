import { NextResponse } from "next/server";
import { GET_businessTypes } from "../_handlers";

export async function GET(req: Request) {
  try {
    return await GET_businessTypes(req);
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to load business types.", data: [] },
      { status: 502 }
    );
  }
}
