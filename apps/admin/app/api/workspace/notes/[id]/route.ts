import { NextRequest } from "next/server";

import { forwardAdminRequest } from "@/lib/serverProxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const body = await req.json();
  const { id } = await context.params;

  return forwardAdminRequest(req, {
    endpoint: `/api/workspace/notes/${id}`,
    method: "PATCH",
    body,
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return forwardAdminRequest(req, {
    endpoint: `/api/workspace/notes/${id}`,
    method: "DELETE",
  });
}
