import { NextRequest } from "next/server";

import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  return forwardAdminRequest(req, {
    endpoint: "/api/workspace/notes",
    method: "GET",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  return forwardAdminRequest(req, {
    endpoint: "/api/workspace/notes",
    method: "POST",
    body,
  });
}
