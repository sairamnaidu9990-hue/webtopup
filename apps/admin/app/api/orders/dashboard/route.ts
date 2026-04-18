import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  return forwardAdminRequest(req, {
    endpoint: "/api/orders/dashboard",
    method: "GET",
  });
}
