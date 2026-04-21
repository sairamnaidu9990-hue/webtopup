import { NextResponse } from "next/server";

import { BACKEND_API_BASE } from "@/lib/runtimeConfig";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_BASE}/api/games/storefront`, {
      next: {
        revalidate: 60,
      },
    });

    const payload = await response.json().catch(() => ({
      trendingGames: [],
      allGames: [],
    }));

    return NextResponse.json(payload, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        trendingGames: [],
        allGames: [],
        message: "Backend tidak dapat dihubungi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 502,
      }
    );
  }
}

