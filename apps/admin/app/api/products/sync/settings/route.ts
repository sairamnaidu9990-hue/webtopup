import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  const queryString = req.nextUrl.searchParams.toString();
  const endpoint = queryString
    ? `/api/products/sync/settings?${queryString}`
    : "/api/products/sync/settings";

  return forwardAdminRequest(req, {
    endpoint,
    method: "GET",
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const queryString = req.nextUrl.searchParams.toString();
  const endpoint = queryString
    ? `/api/products/sync/settings?${queryString}`
    : "/api/products/sync/settings";

  return forwardAdminRequest(req, {
    endpoint,
    method: "PUT",
    body,
  });
}
