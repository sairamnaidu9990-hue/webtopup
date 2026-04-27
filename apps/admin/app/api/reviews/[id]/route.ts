import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const body = await req.json().catch(() => ({}));
  const { id } = await context.params;

  return forwardAdminRequest(req, {
    endpoint: `/api/reviews/${encodeURIComponent(id)}`,
    method: "PATCH",
    body,
  });
}
