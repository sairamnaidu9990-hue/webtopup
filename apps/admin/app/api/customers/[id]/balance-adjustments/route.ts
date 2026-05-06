import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  return forwardAdminRequest(req, {
    endpoint: `/api/customers/${id}/balance-adjustments`,
    method: "POST",
    body,
  });
}
