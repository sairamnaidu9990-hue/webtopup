import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  const queryString = req.nextUrl.searchParams.toString();
  const endpoint = queryString ? `/api/orders?${queryString}` : "/api/orders";

  return forwardAdminRequest(req, {
    endpoint,
    method: "GET",
  });
}
