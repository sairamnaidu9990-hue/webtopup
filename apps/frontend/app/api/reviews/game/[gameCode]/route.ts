import { NextRequest, NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ gameCode: string }> }
) {
  try {
    const { gameCode } = await context.params;
    const response = await fetch(
      `${BACKEND_API_BASE}/api/reviews/game/${encodeURIComponent(gameCode)}`,
      {
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => ({
      message: "Respons backend tidak valid",
    }));

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Backend tidak dapat dihubungi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 502,
      }
    );
  }
}
