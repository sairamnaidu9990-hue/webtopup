import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  return forwardAdminRequest(req, {
    endpoint: "/api/site-settings",
    method: "GET",
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  return forwardAdminRequest(req, {
    endpoint: "/api/site-settings",
    method: "PATCH",
    body,
  });
}
