import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const body = await req.json().catch(() => ({}));
  const { id } = await context.params;

  return forwardAdminRequest(req, {
    endpoint: `/api/promo-codes/${encodeURIComponent(id)}`,
    method: "PATCH",
    body,
  });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return forwardAdminRequest(req, {
    endpoint: `/api/promo-codes/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
}
