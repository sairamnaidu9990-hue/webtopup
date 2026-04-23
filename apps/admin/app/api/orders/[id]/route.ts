import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  return forwardAdminRequest(req, {
    endpoint: `/api/orders/${encodeURIComponent(id)}`,
    method: "PATCH",
    body,
  });
}
