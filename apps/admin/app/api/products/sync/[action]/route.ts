import { NextRequest, NextResponse } from "next/server";
import { queueAdminRequest } from "@/lib/serverProxy";

const allowedActions = new Set(["games", "details", "variants", "all"]);
const actionLabels: Record<string, string> = {
  games: "Sync games",
  details: "Sync details",
  variants: "Sync variants",
  all: "Sync all",
};

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

  return queueAdminRequest(req, {
    endpoint: `/api/products/sync/${action}`,
    method: "POST",
    body,
    acceptedMessage: `${
      actionLabels[action] || "Sinkronisasi"
    } dimulai di background. Pantau Sync Logs untuk status akhirnya.`,
  });
}
