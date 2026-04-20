import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  const queryString = req.nextUrl.searchParams.toString();
  const endpoint = queryString ? `/api/app-logs?${queryString}` : "/api/app-logs";

  return forwardAdminRequest(req, {
    endpoint,
    method: "GET",
  });
}
