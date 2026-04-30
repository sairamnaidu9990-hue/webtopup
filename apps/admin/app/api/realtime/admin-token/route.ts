import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function POST(req: NextRequest) {
  return forwardAdminRequest(req, {
    endpoint: "/api/auth/realtime-token",
    method: "POST",
  });
}
