import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function GET(req: NextRequest) {
  return forwardAdminRequest(req, {
    endpoint: "/api/customers",
    method: "GET",
  });
}
