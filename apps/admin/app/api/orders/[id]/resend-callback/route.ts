import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return forwardAdminRequest(req, {
    endpoint: `/api/orders/${encodeURIComponent(id)}/resend-callback`,
    method: "POST",
  });
}
