import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  const queryString = req.nextUrl.searchParams.toString();
  const endpoint = queryString
    ? `/api/admin-team-chat?${queryString}`
    : "/api/admin-team-chat";

  return forwardAdminRequest(req, {
    endpoint,
    method: "GET",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  return forwardAdminRequest(req, {
    endpoint: "/api/admin-team-chat",
    method: "POST",
    body,
  });
}
