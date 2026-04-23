import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  return forwardAdminRequest(req, {
    endpoint: `/api/variants/${id}`,
    method: "PATCH",
    body,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return forwardAdminRequest(req, {
    endpoint: `/api/variants/${id}`,
    method: "DELETE",
  });
}
