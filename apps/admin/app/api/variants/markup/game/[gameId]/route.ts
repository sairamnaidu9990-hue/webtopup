import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

type RouteContext = {
  params: Promise<{
    gameId: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { gameId } = await context.params;
  const body = await req.json().catch(() => ({}));

  return forwardAdminRequest(req, {
    endpoint: `/api/variants/markup/game/${gameId}`,
    method: "PATCH",
    body,
  });
}
