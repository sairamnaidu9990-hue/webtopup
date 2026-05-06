import { NextRequest } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const queryString = req.nextUrl.searchParams.toString();

  return forwardAdminRequest(req, {
    endpoint: queryString
      ? `/api/customers/${id}/balance-transactions?${queryString}`
      : `/api/customers/${id}/balance-transactions`,
    method: "GET",
  });
}
