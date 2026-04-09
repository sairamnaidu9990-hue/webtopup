import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  return forwardAdminRequest(req, {
    endpoint: "/api/admins/change-password",
    method: "PATCH",
    body,
  });
}
