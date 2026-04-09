import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.toString();

  return forwardAdminRequest(req, {
    endpoint: `/api/sync-logs${search ? `?${search}` : ""}`,
    method: "GET",
  });
}
