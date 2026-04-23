import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  const queryString = req.nextUrl.searchParams.toString();
  const endpoint = queryString
    ? `/api/variants?${queryString}`
    : "/api/variants";

  return forwardAdminRequest(req, {
    endpoint,
    method: "GET",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  return forwardAdminRequest(req, {
    endpoint: "/api/variants",
    method: "POST",
    body,
  });
}
