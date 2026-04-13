import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region");
  const endpoint = region
    ? `/api/products/balance?region=${encodeURIComponent(region)}`
    : "/api/products/balance";

  return forwardAdminRequest(req, {
    endpoint,
    method: "GET",
  });
}
