import { NextRequest, NextResponse } from "next/server";
import { forwardAdminRequest } from "@/lib/serverProxy";

const allowedActions = new Set(["games", "details", "variants", "all"]);

type RouteContext = {
  params: Promise<{
    action: string;
  }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { action } = await context.params;

  if (!allowedActions.has(action)) {
    return NextResponse.json(
      { message: "Aksi sync tidak valid" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));

  return forwardAdminRequest(req, {
    endpoint: `/api/products/sync/${action}`,
    method: "POST",
    body,
  });
}
