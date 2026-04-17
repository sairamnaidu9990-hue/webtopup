import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return forwardAdminRequest(req, {
    endpoint: `/api/orders/${encodeURIComponent(id)}/mark-paid`,
    method: "PATCH",
  });
}
